import './Hero.css';
import { useEffect, useRef } from "react";
import { useNavigate} from "react-router";
import Button from "../../UI/button/Button.tsx";
import Navbar from "../navbar/Navbar.tsx";

const NS = "http://www.w3.org/2000/svg";

function createSvgEl<K extends keyof SVGElementTagNameMap>(
    tag: K
): SVGElementTagNameMap[K] {
    return document.createElementNS(NS, tag);
}

function makeCubicPath(x1: number, y1: number, x2: number, y2: number) {
    const t = 0.45;
    const dx = x2 - x1;
    const cx1 = x1 + dx * t;
    const cx2 = x2 - dx * t;
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
}

const Hero = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef  = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const container = containerRef.current;
        const svg = svgRef.current;
        if (!container || !svg) return;

        // Хранилище id кадров, чтобы отменить при перерисовке/cleanup
        const rafIds: number[] = [];

        const prefersReduced = (() => {
            if (typeof window === "undefined" || !("matchMedia" in window)) return false;
            return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        })();

        const animateDot = (path: SVGPathElement, dot: SVGCircleElement, speed = 250) => {
            // speed: пикселей в секунду
            const total = path.getTotalLength();
            if (total <= 0) return;

            let start = performance.now();

            const tick = (ts: number) => {
                const elapsed = (ts - start) / 1000; // сек
                const dist = (elapsed * speed) % total;
                const pt = path.getPointAtLength(dist);
                dot.setAttribute("cx", String(pt.x));
                dot.setAttribute("cy", String(pt.y));
                const id = requestAnimationFrame(tick);
                rafIds.push(id);
            };

            if (prefersReduced) {
                // Без анимации: просто поставить точку в середину пути
                const pt = path.getPointAtLength(total / 2);
                dot.setAttribute("cx", String(pt.x));
                dot.setAttribute("cy", String(pt.y));
                return;
            }

            const id = requestAnimationFrame(tick);
            rafIds.push(id);
        };

        const cleanupAnimations = () => {
            while (rafIds.length) {
                const id = rafIds.pop();
                if (typeof id === "number") cancelAnimationFrame(id);
            }
        };

        const drawConnections = () => {
            cleanupAnimations();
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            const devices = container.querySelectorAll<HTMLDivElement>(".diagram-section__container__device-box");
            const cli = container.querySelector<HTMLDivElement>(".diagram-section__container__cli-box");
            const hub = container.querySelector<HTMLDivElement>(".diagram-section__container__hub-box");
            if (!hub) return;

            const hubRect = hub.getBoundingClientRect();
            const contRect = container.getBoundingClientRect();
            const hubX = hubRect.left - contRect.left + hubRect.width / 2;
            const hubY = hubRect.top - contRect.top + hubRect.height / 2;

            const connect = (el: HTMLDivElement) => {
                if (getComputedStyle(el).display === "none") return;

                const r = el.getBoundingClientRect();
                // Центр элемента как стартовая точка
                const x1 = r.left - contRect.left + r.width / 2;
                const y1 = r.top - contRect.top + r.height / 2;

                const path = createSvgEl("path");
                path.setAttribute("d", makeCubicPath(x1, y1, hubX, hubY));
                path.setAttribute("fill", "none");
                path.setAttribute("class", "conn-curve");
                path.setAttribute("aria-hidden", "true");
                path.setAttribute("focusable", "false");

                const dot = createSvgEl("circle");
                dot.setAttribute("r", "4");
                dot.setAttribute("class", "conn-dot");
                dot.setAttribute("aria-hidden", "true");
                dot.setAttribute("focusable", "false");

                // Добавить в DOM до расчёта длины
                const frag = document.createDocumentFragment();
                frag.appendChild(path);
                frag.appendChild(dot);
                svg.appendChild(frag);

                // Запустить анимацию точки вдоль пути
                animateDot(path, dot, 140); // скорость можно подстроить
            };

            devices.forEach((d) => connect(d));
            if (cli) connect(cli);
        };

        // Первичная отрисовка
        drawConnections();

        // Наблюдение за размером контейнера
        const ro =
            typeof window !== "undefined" && "ResizeObserver" in window
                ? new ResizeObserver(() => drawConnections())
                : null;

        if (ro) ro.observe(container);

        const onResize = () => drawConnections();
        window.addEventListener("resize", onResize, { passive: true });

        return () => {
            ro?.disconnect();
            window.removeEventListener("resize", onResize);
            cleanupAnimations();
            while (svg.firstChild) svg.removeChild(svg.firstChild);
        };
    }, []);



    return (
        <>
            <Navbar>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                        data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false"
                        aria-label="Переключить навигацию">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item">
                            <a className="nav-link" href="#features">Возможности</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#diagram">О системе</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#footer">Контакты</a>
                        </li>
                        <li className="nav-item ms-lg-3">
                            <Button className="btn-signin" onClick={() => navigate('/dashboard')}>
                                <svg className="btn-signin__icon" xmlns="http://www.w3.org/2000/svg"
                                     viewBox="0 0 96 96"
                                     width="512" height="512">
                                    <path
                                        d="M69.3677,51.0059a30,30,0,1,0-42.7354,0A41.9971,41.9971,0,0,0,0,90a5.9966,5.9966,0,0,0,6,6H90a5.9966,5.9966,0,0,0,6-6A41.9971,41.9971,0,0,0,69.3677,51.0059ZM48,12A18,18,0,1,1,30,30,18.02,18.02,0,0,1,48,12ZM12.5977,84A30.0624,30.0624,0,0,1,42,60H54A30.0624,30.0624,0,0,1,83.4023,84Z"/>
                                </svg>
                                <label className="btn-signin__text" htmlFor="signin">Личный кабинет</label>
                            </Button>
                        </li>
                    </ul>
                </div>
            </Navbar>

            <section className="hero-section">
                <div className="hero-section__container">
                    <h1 className="hero-section__container__title">IPC Monitor</h1>
                    <p className="hero-section__container__tagline">Единая система мониторинга промышленных компьютеров</p>
                    <p className="hero-section__container__description">
                        Интегрированное решение для централизованного контроля всего парка промышленных ПК.
                        Отслеживайте производительность, получайте оповещения в реальном времени и управляйте
                        всеми устройствами с единой панели управления.
                    </p>
                    <Button className="hero-section__container__btn-cta" onClick={() => navigate('/dashboard')}>Начать мониторинг</Button>
                </div>
            </section>

            <section className="diagram-section" id="diagram">
                <h2 className="diagram-section__title">Архитектура системы</h2>
                <div className="diagram-section__architecture">
                    <div className="diagram-section__container" ref={containerRef}>
                        <svg
                            id="connectionsSvg"
                            ref={svgRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none'
                            }}
                            aria-hidden="true">
                            </svg>

                            <div className="diagram-section__container__device-box diagram-section__container__device-1" data-device="1">
                                <div className="diagram-section__container__device-box__header">
                                    <i className="fa-solid fa-server diagram-section__container__device-box__icon" aria-hidden="true"></i>
                                    <div className="diagram-section__container__device-status" role="status" aria-label="Онлайн"></div>
                                </div>
                                <div className="diagram-section__container__device-box__name">IPC-01</div>
                                <div className="diagram-section__container__device-box__label">Промышленный ПК</div>
                            </div>

                            <div className="diagram-section__container__device-box diagram-section__container__device-2" data-device="2">
                                <div className="diagram-section__container__device-box__header">
                                    <i className="fa-solid fa-server diagram-section__container__device-box__icon" aria-hidden="true"></i>
                                    <div className="diagram-section__container__device-status" role="status" aria-label="Онлайн"></div>
                                </div>
                                <div className="diagram-section__container__device-box__name">IPC-02</div>
                                <div className="diagram-section__container__device-box__label">Промышленный ПК</div>
                            </div>

                            <div className="diagram-section__container__device-box diagram-section__container__device-3" data-device="3">
                                <div className="diagram-section__container__device-box__header">
                                    <i className="fa-solid fa-server diagram-section__container__device-box__icon" aria-hidden="true"></i>
                                    <div className="diagram-section__container__device-status" role="status" aria-label="Онлайн"></div>
                                </div>
                                <div className="diagram-section__container__device-box__name">IPC-03</div>
                                <div className="diagram-section__container__device-box__label">Промышленный ПК</div>
                            </div>

                            <div className="diagram-section__container__device-box diagram-section__container__device-4" data-device="4">
                                <div className="diagram-section__container__device-box__header">
                                    <i className="fa-solid fa-server diagram-section__container__device-box__icon" aria-hidden="true"></i>
                                    <div className="diagram-section__container__device-status" role="status" aria-label="Онлайн"></div>
                                </div>
                                <div className="diagram-section__container__device-box__name">IPC-04</div>
                                <div className="diagram-section__container__device-box__label">Промышленный ПК</div>
                            </div>

                            <div className="diagram-section__container__hub-box" data-hub="true">
                                <i className="fas fa-network-wired diagram-section__container__hub-box__icon" aria-hidden="true"></i>
                                <div className="diagram-section__container__hub-box__title">IPC Monitor</div>
                                <div className="diagram-section__container__hub-box__subtitle">Центральная система</div>
                            </div>

                            <div className="diagram-section__container__cli-box" data-hub="true">
                                <i className="fa-solid fa-laptop diagram-section__container__cli-box__icon" aria-hidden="true"></i>
                                <div className="diagram-section__container__cli-box__title">PC</div>
                                <div className="diagram-section__container__cli-box__subtitle">Клиент</div>
                            </div>
                        </div>
                    </div>
            </section>

            <section className="features-section" id="features">
                <div className="features-section__container container">
                    <h2 className="features-section__container__title">Ключевые возможности</h2>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="features-section__container__card">
                                <div className="features-section__container__card__icon">
                                    <i className="fas fa-network-wired" aria-hidden="true"></i>
                                </div>
                                <h3 className="features-section__container__card__title">Централизованный контроль</h3>
                                <p className="features-section__container__card__description">
                                    Мониторьте все устройства с одной панели управления.
                                    Единый интерфейс для полного контроля всего парка промышленных ПК.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="features-section__container__card">
                                <div className="features-section__container__card__icon">
                                    <i className="fas fa-bell" aria-hidden="true"></i>
                                </div>
                                <h3 className="features-section__container__card__title">Умные оповещения</h3>
                                <p className="features-section__container__card__description">
                                    Получайте уведомления о проблемах в реальном времени.
                                    Система автоматически информирует вас о критических событиях.
                                </p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="features-section__container__card">
                                <div className="features-section__container__card__icon">
                                    <i className="fas fa-chart-line" aria-hidden="true"></i>
                                </div>
                                <h3 className="features-section__container__card__title">Аналитика и отчеты</h3>
                                <p className="features-section__container__card__description">
                                    Анализируйте производительность и тренды.
                                    Детальная статистика и графики для принятия обоснованных решений.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Hero;