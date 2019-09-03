import React from 'react'
import classNames from 'classnames';
import sanitizeHtml from 'sanitize-html'
import { connect } from 'react-redux';
import {
  setCurrentElem,
  removeCurrentElem
} from '../redux/reducers/currentElemReducer'
import { PermissionContext } from '../contexts/permission-context';
import {
  addNewComponent
} from '../redux/reducers/appDataReducers'
import {setCursorToEnd} from '../utils/helpers'

class ContentEditable extends React.Component{
  
  constructor(props) {
    super(props)
    this.state = {}
    ContentEditable.contextType = PermissionContext
  }

  componentDidMount(){
    this.handleFocusAndBlur()
  }

  componentDidUpdate(oldProps, oldState){
    this.handleFocusAndBlur(oldProps, oldState)
  }
    
  handleFocusAndBlur = (oldProps, oldState) => {
    if(this.props.currentElem.elemId === this.props.id){
      if(this.elem)
        this.elem.focus()
    }
    else if(oldProps && this.props.currentElem.elemId === oldProps.currentElem.elemId){
      if(this.elem)
        this.elem.blur()
    }
  }

  emitChange = (e, context) => {
    if (!this.props.componentType && e.target.innerHTML) {
      context.emitUpdate(null, { content: e.target.innerHTML }, 'updateTitle')
    }                   // Block to make changes to title of the page
  }

  handleMouseUp = (e) => {
    if(!this.props.componentType)
      this.props.setCurrentElem(this.props.id)
  }
  
  handleFocus = (e) => {
    e.persist()
    if(!this.props.componentType)
      setCursorToEnd(e)
  }

  handleNewLine = (e) => {
    if(e.keyCode === 13 && this.props.id === `page-title`) {
      e.preventDefault()
      this.props.addNewComponent({ id: undefined, componentType: 'Text' })
      return false
    }
  }

  render() {
    const { placeholder, className, styles, listOrder, content } = this.props
    const {context} = this
    return(
      <div className={classNames("component-section", context.status.toLowerCase())}>
        {listOrder}
        <div
          data-root="true"
          ref={node => this.elem = node}
          className={classNames(className, context.status.toLowerCase())}
          onMouseUp={this.handleMouseUp}
          onFocus={this.handleFocus}
          onBlur={e => this.emitChange(e, context)}
          contentEditable={context.status === 'Edit'}
          placeholder={content || context.status === 'Edit' ? placeholder : ''}
          dangerouslySetInnerHTML={{__html: sanitizeHtml(content || '')}}
          styles={styles}
          data-gramm_editor="false"
          onSelect={context.handleSelection}
          onKeyDown={this.handleNewLine}
        />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  currentElem: state.currentElem
})

const mapDispatchToProps = {
  setCurrentElem,
  removeCurrentElem,
  addNewComponent,
}
export default connect(mapStateToProps, mapDispatchToProps)(ContentEditable)