import {useMemo, type MouseEvent, useRef, useState} from "react";
import classes from "./LineChart.module.css";

interface TelemetryProps {
    values: number[];
}

const LineChart = (props: TelemetryProps) => {
    const { values } = props;
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const width = 200;
    const height = 50;

    const stepX = values.length > 1 ? width / (values.length - 1) : 0;
    const points = useMemo(
        () =>
            values.map((num, i) => {
                const x = width - i * stepX; // инверсия оси X
                const y = height - (num / 100) * height;
                return { x, y, v: num };
            }),
        [values, stepX]
    );

    const polyline = useMemo(
        () => points.map((p) => `${p.x},${p.y}`).join(" "),
        [points]
    );

    const toSvgPoint = (svg: SVGSVGElement, clientX: number, clientY: number) => {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const m = svg.getScreenCTM();
        return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    };

    const onMove = (e: MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg || points.length === 0) return;

        const p = toSvgPoint(svg, e.clientX, e.clientY);
        const clampedX = Math.max(0, Math.min(width, p.x));

        setHoverX(clampedX);

        const idx = stepX > 0 ? Math.round((width - clampedX) / stepX) : 0;
        const clamped = Math.max(0, Math.min(points.length - 1, idx));
        setActiveIdx(clamped);
    };

    const onLeave = () => {
        setHoverX(null);
        setActiveIdx(null);
    };

    const active = activeIdx != null ? points[activeIdx] : null;

    return (
        <div className={classes.chart}>
            <svg
                ref={svgRef}
                className={classes.svg}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                role="img"
                aria-label="График загрузки CPU со значениями по наведению"
            >
                <polyline className={classes.line} points={polyline} />

                {hoverX != null && (
                    <line className={classes.cursor} x1={hoverX} y1={0} x2={hoverX} y2={height} />
                )}

                {active && (
                    <>
                        <circle className={classes.dot} cx={active.x} cy={active.y} r="2.5" />
                        <rect
                            className={classes.tooltipBox}
                            x={Math.min(Math.max(active.x + 6, 0), width - 48)}
                            y={Math.max(active.y - 18, 2)}
                            width="46"
                            height="14"
                            rx="3"
                        />
                        <text
                            className={classes.tooltipText}
                            x={Math.min(Math.max(active.x + 9, 2), width - 42)}
                            y={Math.max(active.y - 8, 12)}
                        >
                            {active.v.toFixed(1)}%
                        </text>
                    </>
                )}

                <rect x="0" y="0" width={width} height={height} fill="transparent" />
            </svg>
        </div>
    );
}

export default LineChart;