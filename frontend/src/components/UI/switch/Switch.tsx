import classes from "./Switch.module.css";
import { useState } from "react";

interface SwitchProps {
    htmlFor: string;
    defaultValue?: boolean | undefined;
    disabled?: boolean | undefined;
    className?: string | undefined;
    onChange?: ((value: boolean) => void) | undefined;
}

const Switch = (props: SwitchProps) => {
    const {
        htmlFor,
        defaultValue = false,
        disabled,
        className,
        onChange
    } = props;
    const [ checked, setChecked ] = useState(defaultValue);

    const handleChange = () => {
        if (disabled) return;
        const newValue = !checked;
        setChecked(newValue);
        onChange?.(newValue);
    }

    return (
        <label className={`${classes.toggle} ${className || ''}`} htmlFor={htmlFor}>
            <input
                type="checkbox"
                className={classes.input}
                id={htmlFor}
                name={htmlFor}
                checked={checked}
                onChange={handleChange}
            />
            <span className={classes.slider}></span>
        </label>
    );
};

export default Switch;