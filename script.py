import asyncio
import json
import os
import socket
from datetime import datetime, timezone

import httpx
import websockets
from pathlib import Path
import psutil
import glob
import sys
from typing import Optional

BACKEND = os.getenv("BACKEND", "localhost:8000/api/v1")

# корректная база для exe/скрипта
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).parent

TOKEN_PATH = BASE_DIR / "token"
SAVED_TOKEN = (
    TOKEN_PATH.read_text(encoding="utf-8").strip() if TOKEN_PATH.is_file() else ""
)


def read_cpu():
    pct = psutil.cpu_percent(interval=0.2)
    f = psutil.cpu_freq()
    freq_mhz = round(f.current, 0) if f else None
    temp_c = read_temperature_c()

    return {
        "temperature_c": (round(temp_c, 1) if temp_c is not None else None),
        "pct": round(pct, 1),
        "freq_mhz": freq_mhz,
    }


def read_memory():
    vm = psutil.virtual_memory()
    total_mb = vm.total / (1024 * 1024)
    used_mb = (vm.total - vm.available) / (1024 * 1024)

    return {
        "total_mb": round(total_mb, 1),
        "used_mb": round(used_mb, 1),
        "pct": round(vm.percent, 1),
    }


def pick_primary_partition():
    try:
        if os.name == "nt":
            return os.environ.get("SystemDrive", "C:")
        parts = psutil.disk_partitions(all=False)
        best = None
        best_total = -1
        for p in parts:
            try:
                usage = psutil.disk_usage(p.mountpoint)
                if usage.total > best_total:
                    best = p.mountpoint
                    best_total = usage.total
            except Exception:
                continue
        return best or "/"
    except Exception:
        return "/"


def read_disk():
    path = pick_primary_partition()
    try:
        usage = psutil.disk_usage(path)
        total_mb = usage.total / (1024 * 1024)
        used_mb = usage.used / (1024 * 1024)
        free_mb = usage.free / (1024 * 1024)
        return {
            "mount": path,
            "total_mb": round(total_mb, 1),
            "used_mb": round(used_mb, 1),
            "free_mb": round(free_mb, 1),
            "used_pct": round(usage.percent, 1),
        }
    except Exception:
        return None


# ---------- CPU / GPU через OpenHardwareMonitor ----------


def read_ohm_sensors():
    """
    Чтение всех сенсоров из OpenHardwareMonitor через WMI.
    Требует запущенный OpenHardwareMonitor.exe с включенной WMI.
    """
    if os.name != "nt":
        return None
    try:
        import wmi

        w = wmi.WMI(namespace="root\\OpenHardwareMonitor")
        return list(w.Sensor())
    except Exception:
        return None


def read_cpu_temp_from_ohm():
    sensors = read_ohm_sensors()
    if not sensors:
        return None

    temps = []
    for s in sensors:
        try:
            if s.SensorType == "Temperature" and "CPU" in (s.Name or ""):
                if s.Value is not None:
                    temps.append(float(s.Value))
        except Exception:
            continue

    if temps:
        return float(sum(temps) / len(temps))
    return None


def read_cpu_fan_from_ohm():
    sensors = read_ohm_sensors()
    if not sensors:
        return None

    rpms = []
    for s in sensors:
        try:
            if s.SensorType == "Fan" and "CPU" in (s.Name or ""):
                if s.Value is not None:
                    rpms.append(int(s.Value))
        except Exception:
            continue

    if rpms:
        # берём максимум (часто один реальный вентиль)
        return max(rpms)
    return None


# ---------- старые функции температуры как fallback ----------


def read_linux_sys_thermal() -> Optional[float]:
    try:
        paths = glob.glob("/sys/class/thermal/thermal_zone*/temp")
        for p in paths:
            try:
                v = Path(p).read_text().strip()
                if v and v.isdigit():
                    val = int(v) / 1000.0
                    return float(val)
                else:
                    val = float(v) / 1000.0
                    return float(val)
            except Exception:
                continue
    except Exception:
        pass
    return None


def read_windows_wmi_temp() -> Optional[float]:
    try:
        import wmi

        w = wmi.WMI(namespace="root\\cimv2")
        try:
            zones = w.Win32_PerfFormattedData_Counters_ThermalZoneInformation()
            for z in zones:
                k = getattr(z, "Temperature", None)
                if k:
                    if k > 200.0:
                        return float(k) - 273.15
                    return float(k)
        except Exception:
            pass

        w = wmi.WMI(namespace="root\\wmi")
        sensors = w.MSAcpi_ThermalZoneTemperature()
        for s in sensors:
            k = getattr(s, "CurrentTemperature", None)
            if k:
                return float(k) / 10.0 - 273.15
    except Exception:
        pass
    return None


def read_temperature_c():
    # 1. сначала пробуем через OpenHardwareMonitor (Windows)
    if os.name == "nt":
        t = read_cpu_temp_from_ohm()
        if t is not None:
            return t

    # 2. стандартный psutil (Linux / редкие Windows-конфиги)
    try:
        t = psutil.sensors_temperatures(fahrenheit=False)
        if t:
            for key in (
                "coretemp",
                "k10temp",
                "cpu-thermal",
                "cpu_thermal",
                "acpitz",
                "zenpower",
            ):
                arr = t.get(key)
                if arr:
                    cur = arr[0].current
                    if cur:
                        return float(cur)
            for arr in t.values():
                if arr and arr[0].current:
                    return float(arr[0].current)
    except Exception:
        pass

    # 3. Linux fallback
    if sys.platform.startswith("linux"):
        v = read_linux_sys_thermal()
        if v:
            return v

    # 4. Windows WMI fallback
    if os.name == "nt":
        v = read_windows_wmi_temp()
        if v:
            return v

    return None


def read_fan_rpm():
    # 1. пробуем через OpenHardwareMonitor (Windows)
    if os.name == "nt":
        rpm = read_cpu_fan_from_ohm()
        if rpm is not None:
            return rpm

    # 2. psutil как раньше (Linux)
    try:
        f = psutil.sensors_fans()
        if f:
            for arr in f.values():
                if arr and arr[0].current:
                    return int(arr[0].current)
    except Exception:
        pass
    return None


def read_sensors():
    fan = read_fan_rpm()
    return {
        "fan_rpm": fan,
    }


NET_PREV = None
NET_PREV_TS = None


def read_network():
    global NET_PREV, NET_PREV_TS

    io = psutil.net_io_counters()
    if not io:
        return None

    now = datetime.now(timezone.utc).timestamp()

    down_bps = None
    up_bps = None

    if NET_PREV is not None and NET_PREV_TS is not None:
        dt = max(now - NET_PREV_TS, 1e-3)
        down_bps = (io.bytes_recv - NET_PREV.bytes_recv) * 8.0 / dt
        up_bps = (io.bytes_sent - NET_PREV.bytes_sent) * 8.0 / dt

    NET_PREV = io
    NET_PREV_TS = now

    return {
        "bytes_sent_total": io.bytes_sent,
        "bytes_recv_total": io.bytes_recv,
        "down_mbps": round(down_bps / 1e6, 3) if down_bps is not None else None,
        "up_mbps": round(up_bps / 1e6, 3) if up_bps is not None else None,
    }


def payload():
    return {
        "type": "telemetry",
        "payload": {
            "ts": datetime.now(timezone.utc).isoformat(),
            "cpu": read_cpu(),
            "memory": read_memory(),
            "disk": read_disk(),
            "sensors": read_sensors(),
            "network": read_network(),
        },
    }


async def run(uri: str):
    attempts = 5
    while True:
        if attempts == 0:
            raise Exception("Attempts exceeded")
        try:
            async with websockets.connect(
                uri, ping_interval=20, ping_timeout=20, close_timeout=20
            ) as ws:
                TOKEN_PATH.write_text(SAVED_TOKEN, encoding="utf-8")
                while True:
                    data = await ws.recv()
                    print(data)
                    msg = json.loads(data)
                    if msg.get("type") == "telemetry":
                        while True:
                            await ws.send(json.dumps(payload()))
                            ack = await ws.recv()
                            print("ACK:", ack)
                            await asyncio.sleep(5)
        except Exception:
            pass
        await asyncio.sleep(10)
        attempts -= 1


if not SAVED_TOKEN:
    with httpx.Client(timeout=5.0) as client:
        response = client.post(
            f"http://{BACKEND}/devices/token",
            json={"name": socket.gethostname()},
        )
        response.raise_for_status()
        SAVED_TOKEN = response.json()["token"]
        print(f"Claim token: {SAVED_TOKEN}")

uri = f"ws://{BACKEND}/telemetry/?token={SAVED_TOKEN}"
asyncio.run(run(uri))
