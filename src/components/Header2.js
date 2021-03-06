import React from 'react'
import ContentEditable from './ContentEditable'
import withComponent from './withComponent';


const WrappedHeader2 = (props) => {
  return (
    <ContentEditable
      {...props}
      placeholder="Subheading"
      className="cm-header2"
    />
  )
}

export const Header2 = withComponent(WrappedHeader2)

