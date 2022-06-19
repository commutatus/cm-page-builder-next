import React from 'react'
import ContentEditable from './ContentEditable'
import withComponent from './withComponent'

const WrappedTitle = (props) => {
  return (
    <ContentEditable
      {...props}
      id="page-title"
      placeholder="Title of the page"
      className="cm-title"
    />
  )
}

export const Title = withComponent(WrappedTitle)