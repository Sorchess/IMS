import classes from './Button.module.css';
import type { ReactNode, CSSProperties, MouseEvent } from 'react';

interface ButtonProps {
    children?: ReactNode | undefined;
    disabled?: boolean | undefined;
    onClick?: ((e: MouseEvent) => void) | ((e: MouseEvent) => Promise<void>) | undefined;
    className?: string | undefined;
    styles?: CSSProperties | undefined;
}

const Button = (props: ButtonProps) => {
    const { children, disabled = false, onClick, className, styles } = props;
    const handleClick = async (e: MouseEvent) => {
        if (disabled) return;
        try {
            const result = onClick?.(e);
            if (result instanceof Promise) {
                await result;
            }
        } catch (error) {
            console.error('Error in button click handler:', error);
        }
    }

    return (
        <button type="button" className={`${classes.btn} ${className || ''}`} onClick={handleClick} style={styles}>
            {children}
        </button>
    );
};

export default Button;