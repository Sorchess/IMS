import Button from "../../UI/button/Button.tsx";
import Input from "../../UI/input/Input.tsx";
import {useNavigate} from "react-router";
import './Recover.css';
import Logo from "../../UI/logo/Logo.tsx";
import {useState} from "react";
import socket from "../../../assets/images/socket.png";

const RecoverForm = () => {
    const [emailSent, setEmailSent] = useState(false);
    const navigate = useNavigate();
    return (
        <>
            <Button className="recover-back-btn" onClick={() => navigate('/auth')}>
                <svg className="recover-back-btn-icon" xmlns="http://www.w3.org/2000/svg" id="Outline"
                     viewBox="0 0 24 24" width="512" height="512">
                    <path
                        d="M23.12,9.91,19.25,6a1,1,0,0,0-1.42,0h0a1,1,0,0,0,0,1.41L21.39,11H1a1,1,0,0,0-1,1H0a1,1,0,0,0,1,1H21.45l-3.62,3.61a1,1,0,0,0,0,1.42h0a1,1,0,0,0,1.42,0l3.87-3.88A3,3,0,0,0,23.12,9.91Z"/>
                </svg>
                <label className="recover-back-btn-text" htmlFor="back">Назад</label>
            </Button>

            <img className="recover-bg-img" src={socket} alt="" style={{position: 'absolute', width: "auto", height: "100%"}}/>

            <div className="recover-card">
                <form className="recover-form">
                    <Logo className="recover-logo" styles={{position: "absolute", top: "50px"}}/>
                    <h2>Восстановление пароля</h2>
                    {emailSent
                        ?
                        <p style={{margin: 0}}>Письмо отправлено.</p>
                        :
                        <>
                            <p style={{margin: 0}}>Введите адрес электронной почты, который вы указали при регистрации.
                                Мы отправим вам письмо со ссылкой для сброса пароля.</p>
                            Электронная почта
                            <Input type="text" placeholder="Электронная почта"/>
                            <Button className="recover-form-send-btn"
                                    onClick={() => setEmailSent(true)}>Отправить</Button>
                        </>
                    }

                </form>
            </div>
        </>
    )
        ;
};

export default RecoverForm;