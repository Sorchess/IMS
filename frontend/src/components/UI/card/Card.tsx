import classes from './Card.module.css';
import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
    children?: ReactNode | undefined;
    className?: string | undefined;
    styles?: CSSProperties | undefined;
}

const Card = (props: CardProps) => {
    const { children, className, styles } = props;
    return (
        <article className={`${classes.card} ${className || ''}`} style={styles}>
            {children}
        </article>
    );
};

export default Card;