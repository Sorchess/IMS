import { useMemo, useRef, useState, type MouseEvent } from "react";
import classes from "./CombinedLineChart.module.css";

interface CpuMemoryChartProps {
    values1: number[];
    values2: number[];
}

const CombinedLineChart = ({ values1, values2 }: CpuMemoryChartProps) => {
    const width = 400;
    const height = 168;
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const [idx, setIdx] = useState<number | null>(null);

    const len = Math.min(values1.length, values2.length);

    const points = useMemo(() => {
        if (len === 0) return { cpuPts: [], memPts: [] };

        const stepX = len > 1 ? width / (len - 1) : 0;
        const padTop = 10;
        const padBottom = 10;
        const usableH = height - padTop - padBottom;

        const toY = (v: number) => {
            const clamped = Math.max(0, Math.min(100, v ?? 0));
            return padTop + ((100 - clamped) / 100) * usableH;
        };

        const cpuPts = values1.slice(0, len).map((v, i) => ({
            x: i * stepX,
            y: toY(v),
            v,
        }));

        const memPts = values2.slice(0, len).map((v, i) => ({
            x: i * stepX,
            y: toY(v),
            v,
        }));

        return { cpuPts, memPts };
    }, [values1, values2, len]);

    const cpuPolyline = useMemo(
        () => points.cpuPts.map((p) => `${p.x},${p.y}`).join(" "),
        [points.cpuPts]
    );
    const memPolyline = useMemo(
        () => points.memPts.map((p) => `${p.x},${p.y}`).join(" "),
        [points.memPts]
    );

    const toSvgPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const m = svg.getScreenCTM();
        return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    };

    const handleMove = (e: MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || len === 0) return;

        const p = toSvgPoint(svgRef.current, e.clientX, e.clientY);
        const clampedX = Math.max(0, Math.min(width, p.x));

        setHoverX(clampedX);

        const stepX = len > 1 ? width / (len - 1) : 0;
        const i = stepX > 0 ? Math.round(clampedX / stepX) : 0;
        const clampedIdx = Math.max(0, Math.min(len - 1, i));
        setIdx(clampedIdx);
    };

    const handleLeave = () => {
        setHoverX(null);
        setIdx(null);
    };

    const cpuActive = idx != null ? points.cpuPts[idx] : null;
    const memActive = idx != null ? points.memPts[idx] : null;

    return (
        <svg
            ref={svgRef}
            className={classes.chart}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-label="График загрузки CPU и памяти"
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
        >
            <line x1="0" y1="50" x2="400" y2="50" className={classes.gridLine} />
            <line x1="0" y1="100" x2="400" y2="100" className={classes.gridLine} />
            <line x1="0" y1="150" x2="400" y2="150" className={classes.gridLine} />

            <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={cpuPolyline}
            />
            <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={memPolyline}
            />

            {hoverX != null && (
                <line
                    x1={hoverX}
                    y1={0}
                    x2={hoverX}
                    y2={200}
                    className={classes.cursorLine}
                />
            )}

            {cpuActive && (
                <circle
                    cx={cpuActive.x}
                    cy={cpuActive.y}
                    r="3"
                    className={classes.cpuDot}
                />
            )}
            {memActive && (
                <circle
                    cx={memActive.x}
                    cy={memActive.y}
                    r="3"
                    className={classes.memDot}
                />
            )}

            {idx != null && cpuActive && memActive && (
                <>
                    <rect
                        x={Math.min(Math.max(cpuActive.x + 8, 4), 400 - 90)}
                        y={8}
                        width="66"
                        height="28"
                        rx="3"
                        className={classes.tooltipBg}
                    />
                    <text
                        x={Math.min(Math.max(cpuActive.x + 12, 8), 400 - 86)}
                        y={20}
                        className={classes.tooltipText}
                    >
                        {`CPU: ${cpuActive.v.toFixed(1)}%`}
                    </text>
                    <text
                        x={Math.min(Math.max(cpuActive.x + 12, 8), 400 - 86)}
                        y={30}
                        className={classes.tooltipText}
                    >
                        {`RAM: ${memActive.v.toFixed(1)}%`}
                    </text>
                </>
            )}
        </svg>
    );
};

export default CombinedLineChart;
