// frontend/src/components/ui/button.js
import React from 'react';
import '../../index.css';

export const Button = ({
    children,
    variant = 'default',
    size = 'default',
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700',
        outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
        ghost: 'hover:bg-gray-100 text-gray-700',
    };

    const sizes = {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-6',
        icon: 'h-10 w-10',
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};
