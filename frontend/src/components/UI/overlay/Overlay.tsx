import React, {type ReactNode} from "react";
import classes from './Overlay.module.css';

type Props = {
    show: boolean;
    children?: ReactNode;
    solid?: true;
};

const Overlay: React.FC<Props> = (overlayProps: Props) => {
    const { show, children, solid } = overlayProps;
    if (!show) return null;

    return (
        <div className={`${classes.overlay} ${solid ? classes.solid : ''}`}>
            {children}
        </div>
    );
};

export default Overlay;
