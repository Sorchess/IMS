import classes from './User.module.css';
import Button from "../button/Button.tsx";
import Card from "../card/Card.tsx";
import {useState, type MouseEvent, useContext} from "react";
import useAuth from "../../../hooks/useAuth.ts";
import {AuthContext} from "../../../contexts/AuthContext.tsx";


interface UserProps {
    avatar_url?: string;
    dropdownMenu?: boolean;
    onSettings?: () => void;
}


const User = (props: UserProps) => {
    const { avatar_url, dropdownMenu = true, onSettings } = props;
    const [ menuOpened, setMenuOpen ] = useState(false);
    const { setUserData } = useContext(AuthContext);
    const { logoutUser } = useAuth();

    const handleLogout = async (e: MouseEvent) => {
        e.preventDefault();
        await logoutUser();
        setUserData(null);
    }

    return (
        <>
            <div className={classes.btn} onClick={() => {
                if (!dropdownMenu) return;
                setMenuOpen(!menuOpened)
            }}>
                {avatar_url
                    ?
                    <img className={classes.user} src={avatar_url}
                         alt="user avatar" role="button" aria-label="Профиль пользователя"/>
                    :
                    <div className={classes.user} role="button"
                         aria-label="Профиль пользователя">
                        <i className="fas fa-user"></i>
                    </div>
                }
            </div>

            <Card className={`${classes.dropdown} ${menuOpened ? '' : classes.hidden}`}>
                <Button onClick={() => onSettings?.()}>
                    <i className="fa-solid fa-gear"></i>
                    <label style={{paddingLeft: '10px'}}>Настройки</label>
                </Button>

                <Button className={classes.exit} onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <label style={{ paddingLeft: '10px'}}>Выйти</label>
                </Button>
            </Card>
        </>
    )
}

export default User;