import classes from './Input.module.css';
import type {ChangeEvent, CSSProperties, Ref } from "react";

interface InputProps {
    type: string;
    styles?: CSSProperties | undefined;
    value?: string | undefined;
    className?: string | undefined;
    placeholder?: string | undefined;
    ref?: Ref<HTMLInputElement> | undefined;
    onChange?: ((event:ChangeEvent<HTMLInputElement>) => void) | undefined;
}

const Input = (props: InputProps) => {
    const { type, styles, value, className, placeholder, ref, onChange } = props;
    return (
        <input ref={ref} type={type} style={styles} value={value} onChange={onChange}
               placeholder={`${placeholder || ''}`} className={`${classes.input} ${className || ''}`}>
        </input>
    );
};

export default Input;