import React from "react";
import classes from './Loading.module.css';

type Props = {
    show: boolean;
};

const LoaderOverlay: React.FC<Props> = ({ show }: Props) => {
    if (!show) return null;

    return (
        <div className={classes.container} aria-hidden="true">
            <div className={`${classes.cube} ${classes.cube_1}`}></div>
            <div className={`${classes.cube} ${classes.cube_2}`}></div>
            <div className={`${classes.cube} ${classes.cube_3}`}></div>
        </div>
    );
};

export default LoaderOverlay;
