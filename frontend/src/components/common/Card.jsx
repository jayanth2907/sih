import React from 'react';
import clsx from 'clsx';

export const Card = ({ children, className, hover = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-brand-card border border-brand-border rounded-2xl p-5",
        hover && "hover:border-brand-border-light hover:shadow-card transition-all duration-200 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
