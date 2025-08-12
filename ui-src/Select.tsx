import React from 'react';
import Control, { ControlProps } from './Control';

const Select = ({
  children,
  ...props
}: ControlProps) => {
  return (
    <Control
      {...props}
      as="select"
      right={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-360 280-560h400L480-360Z"/></svg>}
      rightReadOnly={true}>
      { children }
    </Control>
  )
}

export default Select;