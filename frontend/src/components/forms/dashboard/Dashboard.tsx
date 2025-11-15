import './Dashboard.css';
import Logo from "../../UI/logo/Logo.tsx";
import {type MouseEvent, useContext, useEffect, useState} from "react";
import {AuthContext} from "../../../contexts/AuthContext.tsx";
import Sidebar from "../../UI/sidebar/Sidebar.tsx";
import Card from "../../UI/card/Card.tsx";
import Button from "../../UI/button/Button.tsx";
import Overlay from "../../UI/overlay/Overlay.tsx";
import Input from "../../UI/input/Input.tsx";
import useDevices, {type Device, type Telemetry} from "../../../hooks/useDevices.ts";
import {formatISO} from "../../../utils/isoDate.ts";
import SButton from "../../UI/small_button/SButton.tsx";
import LineChart from "../../UI/lineChart/LineChart.tsx";
import Loading from "../../UI/loading/Loading.tsx";
import User from "../../UI/user/User.tsx";
import {useActiveSection} from "../../../hooks/useActiveSection.ts";
import PieChart from "../../UI/pieChart/PieChart.tsx";
import CombinedLineChart from "../../UI/combinedLineChart/CombinedLineChart.tsx";
import FileUpload from "../../UI/fileUpload/FileUpload.tsx";
import useUsers from "../../../hooks/useUsers.ts";


const Dashboard = () => {
    const [ activeDevice, setActiveDevice ] = useState<number>(0);
    const [ overlayVisibility, setOverlayVisibility ] = useState<string>('');
    const { userData } = useContext(AuthContext);
    const [ devices, setDevices ] = useState<Device[]>([])
    const [ telemetry, setTelemetry ] = useState<Telemetry[]>([])
    const { error, isLoading, token, setToken,
            createDevice, getAllDevices, deleteDevice, getTelemetry,
    } = useDevices();
    const { avatarUpload } = useUsers();
    const active = useActiveSection(["devices", "kpi", "charts", "alerts"]);
    const isActive = (id: string) => active === id;

    // First loading
    useEffect(() => {
        (async () => {
            const data  = await getAllDevices();
            if (data?.data) {
                setDevices(data?.data)
            }
        })();
    }, [])

    // Update telemetry
    useEffect(() => {
        const id = devices[activeDevice]?.id;
        if (!id) return;

        let alive = true;
        const load = async () => {
            try {
                const data  = await getAllDevices();
                if (data?.data) {
                    setDevices(data?.data)
                }

                const telemetry = await getTelemetry(id);
                if (alive && telemetry?.data) setTelemetry(telemetry.data);

            } catch (e) {
                console.error(e);
            }
        };
        load();

        const timer = window.setInterval(load, 5000);

        return () => {
            alive = false;
            window.clearInterval(timer);
        };
    }, [devices[activeDevice]?.id]);

    const handleDeviceCreate = async (e: MouseEvent) => {
        e.preventDefault();
        const data  = await createDevice(token);
        if (data?.data || Array.isArray(data?.data)) {
            setDevices(prev => [...prev, ...data?.data]);
        }
        setOverlayVisibility('');
    }

    const handleDelete = async () => {
        const id = devices[activeDevice]?.id;
        if (!id) return;

        try {
            await deleteDevice(id);
            setDevices(prev => prev.filter(d => d.id !== id));

            setActiveDevice(prev => {
                const nextLen = devices.length - 1;
                if (nextLen <= 0) return 0;
                return Math.min(prev, nextLen - 1);
            });

            setOverlayVisibility("");
        } catch (e) {
            console.error(e);
        }
    };

    const handleAvatarUpload = async (file: File | null) => {
        if (!file) return;
        try {
            const success  = await avatarUpload(file);
            if (success) {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        }
    }

    const scrollToId = (id: string, offset = 110) => {
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    };

    return (
        <>
            <Overlay show={isLoading}>
                <Loading show={isLoading}/>
            </Overlay>

            <Overlay show={overlayVisibility === 'settings'}>
                <Card className="overlay__settings">
                    <div className="overlay__settings__header">
                        <p className="overlay__settings__header__title">Настройки</p>
                        <SButton className="overlay__settings__header__close" onClick={() => setOverlayVisibility('')}>
                            <i className="fa-solid fa-xmark"></i>
                        </SButton>
                    </div>
                    <div className="overlay__settings__content">
                        <div>
                            <div>
                                <User avatar_url={userData?.avatar_url} dropdownMenu={false}/>
                                <label className="overlay__settings__content__title">Ваш аватар</label>
                            </div>
                            <FileUpload onFileChange={handleAvatarUpload}/>
                        </div>
                        <div>
                            <div>
                                <label className="overlay__settings__content__title">Имя пользователя</label>
                            </div>
                            <SButton>
                                <i className="fa-solid fa-pen-to-square"></i>
                            </SButton>
                        </div>
                    </div>
                </Card>
            </Overlay>

            <Overlay show={overlayVisibility === 'add'}>
                <Card className="overlay__new-device">
                    <div className="overlay__new-device__header">
                        <p className="overlay__new-device__header__title">Добавить новое устройство</p>
                        <SButton className="overlay__new-device__header__close" onClick={() => setOverlayVisibility('')}>
                            <i className="fa-solid fa-xmark"></i>
                        </SButton>
                    </div>
                    <div className="overlay__new-device__content">
                        <div>
                            <p className="overlay__new-device__content__subtitle">Для получения ключа доступа
                                воспользуйтесь нашей утилитой.</p>
                            <SButton className="overlay__new-device__content__download"
                                    onClick={() => setOverlayVisibility('')}>
                                <i className="fa-solid fa-download"></i>
                            </SButton>
                        </div>
                        <p className="overlay__new-device__content__title">Ваш ключ доступа</p>
                        <Input type="text" className="overlay__new-device__content__textarea" value={token}
                               placeholder="ключ" onChange={(e) => setToken(e.target.value)}/>
                        <Button className="overlay__new-device__content__add-btn" onClick={handleDeviceCreate}>Добавить</Button>

                    </div>
                </Card>
            </Overlay>

            <Overlay show={overlayVisibility === 'delete'}>
                <Card className="overlay__delete-device">
                    <div className="overlay__delete-device__header">
                        <p className="overlay__delete-device__header__title">Вы уверены что хотите удалить устройство {devices[activeDevice]?.name}?</p>
                        <SButton className="overlay__delete-device__header__close"
                                onClick={() => setOverlayVisibility('')}>
                            <i className="fa-solid fa-xmark"></i>
                        </SButton>
                    </div>
                    <div className="overlay__delete-device__content">
                        <p className="overlay__delete-device__content__subtitle">Внимание! Это действие отменить нельзя.</p>

                        <div>
                            <Button className="overlay__delete-device__delete-btn"
                                    onClick={handleDelete}>Удалить</Button>
                            <Button className="overlay__delete-device__cancel-btn"
                                    onClick={() => setOverlayVisibility('')}>Отмена</Button>
                        </div>
                    </div>
                </Card>
            </Overlay>

            <header className="dashboard__header" role="banner">
                <div className="dashboard__header__content">
                    <Logo/>

                    <div className="dashboard__header__content__search">
                        <i className="fas fa-search" aria-hidden="true"></i>
                        <input type="text" placeholder="Поиск устройств, метрик..." aria-label="Поиск"/>
                    </div>

                    <div className="dashboard__header__content__actions">
                        {/*<div className="dashboard__header__content__actions__notification" role="button"*/}
                        {/*     aria-label="Уведомления">*/}
                        {/*    <i className="fas fa-bell"></i>*/}
                        {/*    <span className="dashboard__header__content__actions__notification__badge"*/}
                        {/*          aria-label="3 новых уведомления">3</span>*/}
                        {/*</div>*/}
                        <label style={{ fontWeight: "700", color: "var(--light-text)" }}>
                            {userData?.username}
                        </label>
                        <User avatar_url={userData?.avatar_url} onSettings={() => setOverlayVisibility('settings')}/>
                    </div>
                </div>
            </header>

            <Sidebar>
                <ul className="dashboard__sidebar">
                    <li className="dashboard__sidebar__item">
                        <button
                            className={`dashboard__sidebar__item__link ${isActive("devices") ? "active" : ""}`}
                            aria-current={isActive("devices") ? "page" : undefined}
                            onClick={() => scrollToId("devices")}
                        >
                            <i className="fas fa-th-large" aria-hidden="true"></i>
                            <span>Обзор</span>
                        </button>
                    </li>
                    <li className="dashboard__sidebar__item">
                        <button
                            className={`dashboard__sidebar__item__link ${isActive("kpi") ? "active" : ""}`}
                            aria-current={isActive("kpi") ? "page" : undefined}
                            onClick={() => scrollToId("kpi")}
                        >
                            <i className="fas fa-chart-line" aria-hidden="true"></i>
                            <span>Системные метрики</span>
                        </button>
                    </li>
                    <li className="dashboard__sidebar__item">
                        <button
                            className={`dashboard__sidebar__item__link ${isActive("alerts") ? "active" : ""}`}
                            aria-current={isActive("alerts") ? "page" : undefined}
                            onClick={() => scrollToId("alerts")}
                        >
                            <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                            <span>Оповещения</span>
                        </button>
                    </li>
                </ul>
            </Sidebar>


            <main className="dashboard" id="dashboard" role="main">
                <section id="devices" aria-label="Устройства">
                    <p className="dashboard__title">Ваши устройства {error}</p>
                    <div className="dashboard__devices">
                        {devices.map((device: Device, index: number) => {
                            return (
                                <Button key={devices[index]?.id}
                                        className={`dashboard__devices__card ${activeDevice === index ? 'active' : ''}`}
                                        onClick={() => setActiveDevice(index)}>
                                    <div className="dashboard__devices__card__header">
                                        <div
                                            className={`dashboard__devices__card__header__icon ${device.status === 'offline' ? device.status : ''}`}>
                                            <i className="fa-solid fa-server" aria-hidden="true"></i>
                                        </div>
                                        <div
                                            className={`dashboard__devices__card__header__indicator ${device.status === 'offline' ? device.status : ''}`}
                                            role="status"
                                            aria-label="Статус"></div>
                                    </div>
                                    <div className="dashboard__devices__card__value">{device.name}</div>
                                    <div
                                        className="dashboard__devices__card__subtitle">Обновлено: {formatISO(device.last_seen_at)}</div>


                                    <div className="dashboard__devices__card__footer">

                                        <div className="dashboard__devices__card__footer__icon eye"
                                             style={activeDevice === index ? {opacity: 1} : {opacity: 0}}>
                                            <i className="fa-solid fa-eye"></i>
                                        </div>

                                        <div className="dashboard__devices__card__footer__icon trash"
                                             onClick={() => setOverlayVisibility('delete')}>
                                            <i className="fa-solid fa-trash"></i>
                                        </div>
                                    </div>
                                </Button>
                            )
                        })}

                        <Button className="dashboard__devices__add-btn" onClick={() => setOverlayVisibility('add')}>
                            <div className="dashboard__devices__card__add-btn__icon">
                                <i className="fa-solid fa-plus"></i>
                            </div>
                        </Button>

                    </div>
                </section>


                <section aria-label="Ключевые показатели" id="kpi">
                <p className="dashboard__title">Системные метрики</p>

                    <div className="dashboard__kpi">
                        {telemetry.length === 0
                            ?
                            <Loading show={true}/>
                            :
                            <>
                                <Card className="dashboard__kpi__card">
                                    <div className="dashboard__kpi__card__header">
                                        <div className="dashboard__kpi__card__header__icon green">
                                            <i className="fas fa-microchip" aria-hidden="true"></i>
                                        </div>
                                        <div className="dashboard__kpi__card__header__indicator green" role="status"
                                             aria-label="Статус"></div>
                                    </div>
                                    <div className="dashboard__kpi__card__value">{telemetry[0]?.cpu.pct}%</div>
                                    <div className="dashboard__kpi__card__label">CPU</div>
                                    <div className="dashboard__kpi__card__subtitle">загрузка</div>
                                    <div className="dashboard__kpi__card__chart">
                                        <LineChart values={telemetry?.map((el) => el?.cpu.pct)}/>
                                    </div>
                                </Card>

                                <Card className="dashboard__kpi__card">
                                    <div className="dashboard__kpi__card__header">
                                        <div className="dashboard__kpi__card__header__icon yellow">
                                            <i className="fas fa-temperature-half" aria-hidden="true"></i>
                                        </div>
                                        <div className="dashboard__kpi__card__header__indicator yellow" role="status"
                                             aria-label="Статус: предупреждение"></div>
                                    </div>
                                    <div className="dashboard__kpi__card__value">{telemetry[0]?.cpu.temperature_c}°C</div>
                                    <div className="dashboard__kpi__card__label">Температура</div>
                                    <div className="dashboard__kpi__card__subtitle">Средняя CPU</div>
                                    <div className="dashboard__kpi__card__subtitle">
                                        {Math.round(telemetry.reduce((acc, el) => acc + el.cpu.temperature_c, 0) / telemetry.length)}
                                        °C
                                    </div>
                                </Card>

                                <Card className="dashboard__kpi__card">
                                    <div className="dashboard__kpi__card__header">
                                        <div className="dashboard__kpi__card__header__icon green">
                                            <i className="fas fa-memory" aria-hidden="true"></i>
                                        </div>
                                        <div className="dashboard__kpi__card__header__indicator green" role="status"
                                             aria-label="Статус"></div>
                                    </div>
                                    <div
                                        className="dashboard__kpi__card__value">
                                        {(telemetry[0]?.memory.used_mb / 1024).toFixed(1)}
                                        /
                                        {(telemetry[0]?.memory.total_mb / 1024).toFixed(1)} GB
                                    </div>
                                    <div className="dashboard__kpi__card__label">Память</div>
                                    <div
                                        className="dashboard__kpi__card__subtitle">{telemetry[0]?.memory.pct}%
                                        использовано
                                    </div>
                                    <div className="dashboard__kpi__card__progress" role="progressbar"
                                         aria-label="Использование памяти">
                                        <div className="dashboard__kpi__card__progress__fill"
                                             style={{width: `${telemetry[0]?.memory.pct}%`}}></div>
                                    </div>
                                </Card>

                                <Card className="dashboard__kpi__card">
                                    <div className="dashboard__kpi__card__header">
                                        <div className="dashboard__kpi__card__header__icon orange">
                                            <i className="fas fa-hard-drive" aria-hidden="true"></i>
                                        </div>
                                        <div className="dashboard__kpi__card__header__indicator orange" role="status"
                                             aria-label="Статус: предупреждение"></div>
                                    </div>
                                    <div className="dashboard__kpi__card__value">{telemetry[0]?.disk.used_pct}%</div>
                                    <div className="dashboard__kpi__card__label">Диск</div>
                                    <div className="dashboard__kpi__card__subtitle">Свободно {Math.round(telemetry[0]?.disk.free_mb / 1024)} GB из {Math.round(telemetry[0]?.disk.total_mb / 1024)} GB</div>

                                </Card>
                            </>
                        }
                    </div>
                </section>

                <section aria-label="Графики метрик" id="charts">
                <div className="dashboard__charts">
                        {telemetry.length !== 0
                            ?
                            <>
                                <Card className="dashboard__charts__card">
                                    <h3 className="dashboard__charts__card__title">CPU и Память</h3>
                                    <div className="dashboard__charts__card__line">
                                        <CombinedLineChart values1={telemetry?.map((el) => el?.cpu.pct)} values2={telemetry?.map((el) => el?.memory.pct)} />
                                    </div>
                                    <div className="dashboard__charts__card__legend" style={{marginTop: '1rem'}}>
                                        <div className="dashboard__charts__card__legend__item">
                                            <div className="dashboard__charts__card__legend__item__color"
                                                 style={{background: '#3b82f6'}}></div>
                                            <span className="dashboard__charts__card__legend__item__label">CPU</span>
                                        </div>
                                        <div className="dashboard__charts__card__legend__item">
                                            <div className="dashboard__charts__card__legend__item__color"
                                                 style={{background: '#10b981'}}></div>
                                            <span className="dashboard__charts__card__legend__item__label">Память</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="dashboard__charts__card">
                                    <h3 className="dashboard__charts__card__title">Сетевой трафик</h3>
                                    <div className="dashboard__charts__card__pie">
                                        <PieChart values={[telemetry[0]?.network.up_mbps, telemetry[0]?.network.down_mbps]}></PieChart>
                                        <div className="dashboard__charts__card__legend">
                                            <div className="dashboard__charts__card__legend__item">
                                                <div className="dashboard__charts__card__legend__item__color"
                                                     style={{background: '#3b82f6'}}></div>
                                                <div>
                                                    <div className="dashboard__charts__card__legend__item__label">Загрузка ↑
                                                    </div>
                                                    <div className="dashboard__charts__card__legend__item__value">{telemetry[0]?.network.up_mbps} Mbps</div>
                                                </div>
                                            </div>
                                            <div className="dashboard__charts__card__legend__item">
                                                <div className="dashboard__charts__card__legend__item__color"
                                                     style={{background: '#10b981'}}></div>
                                                <div>
                                                    <div className="dashboard__charts__card__legend__item__label">Скачивание ↓
                                                    </div>
                                                    <div className="dashboard__charts__card__legend__item__value">{telemetry[0]?.network.down_mbps} Mbps</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </>
                            :
                            null
                        }

                    </div>
                </section>

                <section className="dashboard__alerts" aria-label="Недавние оповещения" id="alerts">
                    <h2 className="dashboard__alerts__title">
                        <i className="fas fa-bell" aria-hidden="true"></i>
                        Недавние оповещения
                    </h2>

                    {/*<div className="dashboard__alerts__item error">*/}
                    {/*    <span className="dashboard__alerts__item__badge red">Ошибка</span>*/}
                    {/*    <div className="dashboard__alerts__item__message">Высокая температура на IPC-02</div>*/}
                    {/*    <div className="dashboard__alerts__item__time">10:23</div>*/}
                    {/*    <button className="dashboard__alerts__item__btn">Подробнее</button>*/}
                    {/*</div>*/}

                    {/*<div className="dashboard__alerts__item warning">*/}
                    {/*    <span className="dashboard__alerts__item__badge yellow">Предупр.</span>*/}
                    {/*    <div className="dashboard__alerts__item__message">Диск SMART warning на IPC-01</div>*/}
                    {/*    <div className="dashboard__alerts__item__time">09:45</div>*/}
                    {/*    <button className="dashboard__alerts__item__btn">Подробнее</button>*/}
                    {/*</div>*/}

                    {/*<div className="dashboard__alerts__item warning">*/}
                    {/*    <span className="dashboard__alerts__item__badge yellow">Предупр.</span>*/}
                    {/*    <div className="dashboard__alerts__item__message">Высокая загрузка CPU на IPC-03</div>*/}
                    {/*    <div className="dashboard__alerts__item__time">09:12</div>*/}
                    {/*    <button className="dashboard__alerts__item__btn">Подробнее</button>*/}
                    {/*</div>*/}

                    {/*<div className="dashboard__alerts__item error">*/}
                    {/*    <span className="dashboard__alerts__item__badge red">Ошибка</span>*/}
                    {/*    <div className="dashboard__alerts__item__message">Сетевой адаптер отключен IPC-04</div>*/}
                    {/*    <div className="dashboard__alerts__item__time">08:30</div>*/}
                    {/*    <button className="dashboard__alerts__item__btn">Подробнее</button>*/}
                    {/*</div>*/}

                    {/*<div className="dashboard__alerts__item success">*/}
                    {/*    <span className="dashboard__alerts__item__badge green">Успешно</span>*/}
                    {/*    <div className="dashboard__alerts__item__message">Обновление ПО завершено IPC-01</div>*/}
                    {/*    <div className="dashboard__alerts__item__time">07:15</div>*/}
                    {/*    <button className="dashboard__alerts__item__btn">Подробнее</button>*/}
                    {/*</div>*/}
                </section>
            </main>


        </>
    )
}

export default Dashboard;