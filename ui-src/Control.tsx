import React from 'react';
import ControlAddon from './ControlAddon';
import './Control.css';

export type ControlProps =  React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> & {
  as?: "input" | "select" | "textarea";
  children?: React.ReactNode;
  inputRef?: any;
  label?: string;
  modifier?: string;
  replacement?: React.ReactNode;
  left?: React.ReactNode;
  leftReadOnly?: boolean;
  right?: React.ReactNode;
  rightReadOnly?: boolean;
  icon?: boolean;
};

const Control = ({
  inputRef,
  label,
  as: Tag = 'input',
  children,
  modifier,
  replacement,
  left,
  leftReadOnly,
  right,
  rightReadOnly,
  icon,
  ...props
}: ControlProps) => {
  return (
    <label className={`c-control ${modifier ? `c-control--${modifier}` : ""} ${props.type ? `c-control--${props.type}` : ""} ${icon ? `c-control--icon` : ""}`}>
      {
        label
        ? <div className="c-control__label">
            { label }
          </div>
        : null
      }
      <div className="c-control__input-wrap">
        { replacement }
        <Tag
          ref={inputRef}
          className={`c-control__input ${right ? "c-control__input--right" : ""} ${left ? "c-control__input--left" : ""}`}
          { ...props }>
          {children}
        </Tag>
        {
          left
          ? <ControlAddon 
              type='left'
              readOnly={leftReadOnly}>
              { left }
            </ControlAddon>
          : null
        }
        {
          right
          ? <ControlAddon 
              type='right'
              readOnly={rightReadOnly}>
              { right }
            </ControlAddon>
          : null
        }
        {
          props.type === "checkbox" || props.type === "radio"
          ? <span className="c-control__checkmark" />
          : null
        }
      </div>
    </label>
  )
}

export default Control;