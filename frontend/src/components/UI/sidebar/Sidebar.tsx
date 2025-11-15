import type {ReactNode} from "react";
import classes from './Sidebar.module.css';

interface SidebarProps {
    children?: ReactNode;
}

const Sidebar = ({ children }: SidebarProps) => {


    return (
        <aside className={classes.sidebar} id="sidebar" role="navigation" aria-label="Основная навигация">
            <nav>
                {children}
            </nav>
        </aside>
    )
}

export default Sidebar;