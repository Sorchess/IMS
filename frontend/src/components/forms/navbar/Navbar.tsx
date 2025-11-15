import './Navbar.css';
import Logo from "../../UI/logo/Logo.tsx";
import type {ReactNode} from "react";

interface NavbarProps {
    children?: ReactNode;
}

const Navbar = ({children}: NavbarProps) => {

    return (
        <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container">
                <Logo/>
                {children}
            </div>
        </nav>
    );
};

export default Navbar;