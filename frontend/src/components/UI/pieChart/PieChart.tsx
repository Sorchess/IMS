import { useMemo, useRef, useState, type MouseEvent } from "react";
import classes from "./PieChart.module.css";

interface TelemetryProps {
    values: [number, number]; // две части
}

const PieChart = ({ values }: TelemetryProps) => {
    const pieRef = useRef<HTMLDivElement | null>(null);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const { total, percents, angle } = useMemo(() => {
        const total = values.reduce((acc, v) => acc + v, 0);
        const percents = total > 0 ? values.map((v) => (v / total) * 100) : [0, 0];
        const angle = (percents[0] / 100) * 360;
        return { total, percents, angle };
    }, [values]);

    const handleMove = (e: MouseEvent<HTMLDivElement>) => {
        const el = pieRef.current;
        if (!el || total <= 0) {
            setHoverIdx(null);
            return;
        }

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const outerR = rect.width / 2;
        const innerR = 70 / 2; // под размер ::after

        if (dist < innerR || dist > outerR) {
            setHoverIdx(null);
            return;
        }

        const rawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        const deg = (rawDeg + 360 + 90) % 360;

        setHoverIdx(deg <= angle ? 0 : 1);
    };

    const handleLeave = () => setHoverIdx(null);

    const label =
        hoverIdx != null && total > 0
            ? `${percents[hoverIdx].toFixed(1)}%`
            : "";

    const bg =
        total > 0
            ? `conic-gradient(
           #3b82f6 0deg ${angle.toFixed(2)}deg,
           #10b981 ${angle.toFixed(2)}deg 360deg
         )`
            : `conic-gradient(#e5e7eb 0deg 360deg)`;

    return (
        <div
            ref={pieRef}
            className={classes.pie}
            role="img"
            aria-label="Круговая диаграмма сетевого трафика"
            style={{ background: bg }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
        >
            {label && <div className={classes.label}>{label}</div>}
        </div>
    );
};

export default PieChart;
