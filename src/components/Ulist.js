import React from 'react'
import ContentEditable from './ContentEditable'
import withComponent from './withComponent'

const WrappedUlist = (props) => {
  return (
    <div className="cm-u-list">
      <ContentEditable
        {...props}
        html={props.html}
        onChange={props.handleChange}
        onInputChange={props.onInputChange}
        placeholder="Bulleted list"
        className="cm-text-block"
        id={props.id}
        data-component-type={'Ulist'}
        listOrder={<span className="bulleted-dot"></span>}
      />
    </div>
  )
}

export const Ulist = withComponent(WrappedUlist)