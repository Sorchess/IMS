import classes from './Footer.module.css';


const Footer = () => {
    return (

        <footer className={classes.footer} id="footer">
            <div className="container">
                <p>2025 IPC Monitor System.</p>
                <div className={classes.footer__links}>
                    <a href="#" target="_blank">Помощь</a>
                    <a href="#" target="_blank">Документация</a>
                    <a href="#" target="_blank">Контакты</a>
                </div>
            </div>
        </footer>

    );
};

export default Footer;