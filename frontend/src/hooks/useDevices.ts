import {useState} from "react";
import DevicesService from "../api/services/DevicesService.ts";

export type Device = {
    name: string;
    id: number;
    token: string;
    status: string;
    created_at: string;
    owner_id: number;
    last_seen_at: string;
};

export type Telemetry = {
    id: number;
    ts: string;
    device_id: number;
    cpu: {
        temperature_c: number;
        pct: number;
        freq_mhz: number;
    };
    memory: {
        total_mb: number;
        used_mb: number;
        pct: number;
    };
    disk: {
        mount: string;
        total_mb: number;
        used_mb: number;
        free_mb: number;
        used_pct: number;
    };
    sensors: {
        fan_rpm: number;
    };
    network: {
        bytes_sent: number;
        bytes_recv: number;
        down_mbps: number;
        up_mbps: number;
    }

};

const useDevices = () => {
    const [ token, setToken ] = useState<string>('');
    const [ isLoading, setLoading ] = useState<boolean>(false);
    const [ error, setError ] = useState<string>('');

    const createDevice = async (token: string) => {
        setLoading(true);
        try {
            const response = await DevicesService.createDevice(token);
            if (response.status === 201) {
                setToken('');
                return response.data;
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }

    }

    const getDevice = async (id: number) => {
        try {
            const response = await DevicesService.getDevice(id);
            if (response.status === 200) {
                return response.data;
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : String(error));
        }
    }

    const getAllDevices = async () => {
        try {
            const response = await DevicesService.getAllDevices();
            if (response.status === 200) {
                return response.data;
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : String(error));
        }
    }

    const deleteDevice = async (id: number) => {
        setLoading(true);
        try {
            const response = await DevicesService.deleteDevice(id);
            if (response.status === 200) {
                return;
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setLoading(false);
        }
    }

    const getTelemetry = async (id: number) => {
        try {
            const response = await DevicesService.getTelemetry(id);
            if (response.status === 200) {
                return response.data;
            }
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : String(error));
        }
    }

    return {
        isLoading,
        token,
        setToken,
        error,
        createDevice,
        getAllDevices,
        getDevice,
        deleteDevice,
        getTelemetry,
    }
}


export default useDevices;