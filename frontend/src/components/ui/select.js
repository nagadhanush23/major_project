// frontend/src/components/ui/select.js
import React from 'react';

export const Select = ({ children, value, onValueChange, ...props }) => {
    return (
        <select
            value={value}
            onChange={(e) => onValueChange && onValueChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
        >
            {children}
        </select>
    );
};

export const SelectTrigger = ({ children, ...props }) => {
    return <div {...props}>{children}</div>;
};

export const SelectValue = ({ placeholder }) => {
    return <option value="">{placeholder}</option>;
};

export const SelectContent = ({ children }) => {
    return <>{children}</>;
};

export const SelectItem = ({ value, children }) => {
    return <option value={value}>{children}</option>;
};
