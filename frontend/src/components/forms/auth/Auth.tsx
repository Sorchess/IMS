import {Link, useNavigate} from "react-router";
import {useState, type MouseEvent, useContext} from "react";

import Button from "../../UI/button/Button.tsx";
import Input from "../../UI/input/Input.tsx";
import Logo from "../../UI/logo/Logo.tsx";
import useAuth from "../../../hooks/useAuth.ts";


import {type ChangeEvent} from "react";
import socket from '../../../assets/images/socket.png'

import './Auth.css';
import Loading from "../../UI/loading/Loading.tsx";
import {AuthContext} from "../../../contexts/AuthContext.tsx";
import Overlay from "../../UI/overlay/Overlay.tsx";


const AuthForm = () => {
    const [userCreated, setUserCreated] = useState(true);
    const navigate = useNavigate();
    const { setUserData } = useContext(AuthContext);
    const {
        isLoading, error, setError,
        email, password,
        setEmail, setPassword,
        registerUser, loginUser
    } = useAuth()

    const handleRegister = async (e: MouseEvent) => {
        e.preventDefault();
        const data  = await registerUser();
        if (data) {
            setUserData(data.data);
        }
    }

    const handleLogin = async (e: MouseEvent) => {
        e.preventDefault();
        const data  = await loginUser();
        if (data) {
            setUserData(data.data);
        }
    }

    return (
        <>
            <Button className="auth-back-btn" onClick={() => navigate('/')}>
                <svg className="auth-back-btn-icon" xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24"
                     width="512" height="512">
                    <path
                        d="M23.12,9.91,19.25,6a1,1,0,0,0-1.42,0h0a1,1,0,0,0,0,1.41L21.39,11H1a1,1,0,0,0-1,1H0a1,1,0,0,0,1,1H21.45l-3.62,3.61a1,1,0,0,0,0,1.42h0a1,1,0,0,0,1.42,0l3.87-3.88A3,3,0,0,0,23.12,9.91Z"/>
                </svg>
                <label className="auth-back-btn-text" htmlFor="back">На главную</label>
            </Button>

            <img className="auth-bg-img" src={socket} alt="" style={{position: 'absolute', width: "auto", height: "100%"}}/>
            <Overlay show={isLoading}>
                <Loading show={isLoading}/>
            </Overlay>

            <div className="auth-card">
                <form className="auth-form">
                    <Logo className="auth-logo" styles={{position: "absolute", top: "50px"}}/>

                    <div className="auth-form-buttons">
                        <Button className={`${userCreated ? ' active' : ''}`}
                                onClick={() => {setUserCreated(true); setError('')}}>Вход</Button>
                        <Button className={`${userCreated ? '' : 'active'}`}
                                onClick={() => {setUserCreated(false); setError('')}}>Регистрация</Button>
                    </div>
                    Электронная почта
                    <Input type="text" placeholder="Электронная почта" value={email}
                           onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}/>
                    Пароль
                    <Input type="password" placeholder="Пароль" value={password}
                           onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}/>
                    {userCreated
                        ?
                        <>
                            <div className="auth-form-forgot-password">
                                Забыли пароль?
                                <Link style={{textDecoration: "none", color: "var(--link)"}}
                                      to="/recover">Восстановить</Link>
                            </div>
                            {error}
                            <Button className="auth-form-login" onClick={handleLogin}
                                    disabled={isLoading}>Войти</Button>
                        </>
                        :
                        <>
                            {error}
                            <Button className="auth-form-register" onClick={handleRegister}
                                    disabled={isLoading}>Зарегистрироваться</Button>
                        </>
                    }

                </form>
            </div>
        </>
    );
};

export default AuthForm;