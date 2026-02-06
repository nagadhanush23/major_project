// frontend/src/components/ui/textarea.js
import React from 'react';

export const Textarea = ({ className = '', ...props }) => {
    return (
        <textarea
            className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    );
};
