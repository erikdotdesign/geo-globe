import React from 'react';
import './Button.css';

const Button = ({
  children,
  type,
  ...props
}: {
  children?: React.ReactNode;
  type?: string;
} & React.ButtonHTMLAttributes) => {
  return (
    <button
      className={`c-button ${type ? `c-button--${type}` : ""}`}
      {...props}>
      {children}
    </button>
  )
}

export default Button;