import type {CSSProperties, ReactNode} from "react";
import classes from './Textarea.module.css';

interface TextareaProps {
    children?: ReactNode | undefined;
    className?: string | undefined;
    styles?: CSSProperties | undefined;
    placeholder?: string | undefined;
}

const Textarea = (props: TextareaProps) => {
    const { children, className, styles, placeholder } = props;
    return (
        <div contentEditable={true} data-placeholder={placeholder} className={`${classes.textArea} ${className || ''}`} style={styles}>
            {children}
        </div>
    );
};

export default Textarea;