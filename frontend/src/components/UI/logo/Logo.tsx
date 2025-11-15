import {Link} from "react-router";
import classes from './Logo.module.css';
import {type CSSProperties } from "react";

interface LogoProps {
    className?: string | undefined;
    styles?: CSSProperties | undefined;
}

const Logo = (props: LogoProps) => {
    const { className, styles } = props;
    return (
        <Link key="logo" className={`${classes.logo} ${className || ''}`} style={styles} to='/'>
            <div className={classes.brand}>
                <i className="fas fa-desktop" aria-hidden="true"></i>
                <span>IPC Monitor</span>
            </div>
            <span className={classes.title}>Мониторинг промышленных ПК</span>
        </Link>
    );
};

export default Logo;