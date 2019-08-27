import React from 'react'
import ReactDOM from 'react-dom'
import { CSSTransition } from 'react-transition-group'
import '../styles/components/AddComponent.css'
import { connect } from 'react-redux';
import {
  addNewComponent,
  updateComponentType,
  updateComponent,
  removeComponent,
} from '../redux/reducers/appDataReducers'
import {
  setCurrentElem,
  removeCurrentElem
} from '../redux/reducers/currentElemReducer'
import { TEXT_INPUT_COMPONENT } from '../utils/constant';
import DragHandle from './DragHandle';
import { PermissionContext } from '../contexts/permission-context';
import {setCursorToEnd} from '../utils/helpers'

//A higher order component for the generic components to handle there functionalily.

class AddComponent extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      showActionBtn: false,
      isFocused: false,
      showHandle:false
    }
  }

  componentDidMount(){
    this.checkAndFocus(this.props)
    AddComponent.contextType = PermissionContext
  }

  componentDidUpdate(){
    this.checkAndFocus(this.props)
  }

  // For newly created component to change the focus
  checkAndFocus = (props) => {
    let {currentElem, id} = props
    let {isFocused} = this.state
    //Compare the old and the new element to check focused has changed or not
    if(currentElem.elemId && id === currentElem.elemId){
      //Get the dom not if it has changed
      let elem = ReactDOM.findDOMNode(this).querySelector(`[data-root="true"]`)
      //check if focused or not
      if(!isFocused){
        this.setState({showActionBtn: true, isFocused: true})
      }
      //if current state is focus the element
    }
    else{
      //when focus is removed doesn't show the handle and the btns
      if(this.state.showActionBtn || this.state.isFocused)
        this.setState({showActionBtn: false, isFocused: false})
    }
  }

  //Change the component type.
  handleMouseUp = (e) => {
    this.setState({showActionBtn: e.target.innerHTML === '', isFocused: true})    
    let comSelDiv = this.elem.querySelector(`[data-block-type="component-select-div"]`)
    if(comSelDiv && comSelDiv.contains(e.target)){
      let currentTarget = e.currentTarget
      let target = e.target.nodeName === 'I' ? e.target.parentNode : e.target
      this.props.updateComponentType({blockId: currentTarget.dataset.blockId, type: target.dataset.type})
    }
  }

  // handle key action and navigation
  handleKeyDown = (e) => {
    let {appData, currentElem, data} = this.props 
    //Intialize all the elem
    let currentElemPos = -1, 
        elemRect = null, 
        caretRect = null, 
        computedStyles = null, 
        elemPad = undefined, 
        elemMar = undefined, 
        extraHeight = undefined
    
    //All the key events related to the component are handled here.   
    switch (e.key) {
      case 'Enter':
        if(!e.shiftKey){
          e.preventDefault()
          let componentType =  ['Ulist', 'Olist'].includes(e.currentTarget.dataset.componentType) ? e.currentTarget.dataset.componentType : 'Text'
          this.props.addNewComponent({id: e.currentTarget.dataset.blockId, componentType })
          break;
        }
      case 'Backspace':
        if(this.elem.querySelector(`[data-root="true"]`).innerHTML === ''){
          if (this.props.data.componentType === 'Ulist' || this.props.data.componentType === 'Olist')
            this.props.updateComponentType({blockId: e.currentTarget.dataset.blockId, type: 'Text'})
          else {
            e.preventDefault()
            let newCurrentId = null
            let fromIndex = appData.componentData.findIndex(object => object.id === currentElem.elemId)
            if (fromIndex > 0) {
              newCurrentId = appData.componentData[fromIndex-1].id
              this.props.removeComponent({blockId: currentElem.elemId})
              this.props.setCurrentElem(newCurrentId)
            }else{
              this.props.updateComponent({blockId: appData.componentData[0].id, newState: {content: ''}})
            }
          }
        }
        break
      case 'ArrowUp':
        elemRect = e.target.getBoundingClientRect()
        caretRect = window.getSelection().getRangeAt(0).getBoundingClientRect()
        computedStyles = window.getComputedStyle(e.target)
        elemPad = computedStyles.getPropertyValue("padding-top").replace('px', '')
        elemMar = computedStyles.getPropertyValue('margin-top').replace('px', '')
        extraHeight = (+elemPad) 
        if((caretRect.x === 0 && caretRect.y === 0) ||  // when no text is there
            (elemRect.top === (caretRect.top - extraHeight)) || // is not a text component
            (elemRect.top === (caretRect.top - extraHeight - 1)) // is a text component
        ){
          e.preventDefault()
          currentElemPos = appData.componentData.findIndex(data => data.id === currentElem.elemId)
          while(currentElemPos > 0){
            if(TEXT_INPUT_COMPONENT.includes(appData.componentData[currentElemPos-1].componentType)){
              this.props.setCurrentElem(appData.componentData[currentElemPos-1].id)
              break
            }
            currentElemPos--
          }
        }
        break
      case 'ArrowDown':
          elemRect = e.target.getBoundingClientRect()
          caretRect = window.getSelection().getRangeAt(0).getBoundingClientRect()
          computedStyles = window.getComputedStyle(e.target)
          elemPad = computedStyles.getPropertyValue("padding-bottom").replace('px', '')
          elemMar = computedStyles.getPropertyValue('margin-bottom').replace('px', '')
          extraHeight = (+elemPad)
          if((caretRect.x === 0 && caretRect.y === 0) || 
              (elemRect.bottom === (caretRect.bottom - extraHeight)) ||
              (elemRect.bottom === (caretRect.bottom + extraHeight + 1))
          ){
            e.preventDefault()
            currentElemPos = appData.componentData.findIndex(data => data.id === currentElem.elemId)
            while(currentElemPos < appData.componentData.length - 1){
              if(TEXT_INPUT_COMPONENT.includes(appData.componentData[currentElemPos+1].componentType)){
                this.props.setCurrentElem(appData.componentData[currentElemPos+1].id)
                break
              }
              currentElemPos++
            }
          }
          break
      default:
        break;
    }
  }

  handleInput = (e) => {
    this.setState({showActionBtn: e.target.innerHTML === ''})
  }

  // handles the focus and set the cursor to right position.
  handleFocus = (e) => {
    e.persist()
    let {appData, currentElem} = this.props
    let prevElemPos, currElemPos
    for(let i in appData.componentData){
      if(appData.componentData[i].id === currentElem.elemId){
        currElemPos = +i
      }
      if(appData.componentData[i].id === currentElem.prevSelectedElemId){
        prevElemPos = +i
      }
    }
    if(currElemPos < prevElemPos)
      setCursorToEnd(e)
  }

  onMouseDown = (e) => {
    this.props.setCurrentElem(this.props.id)
  }

  handleBlur = (e) => {
    if(this.props.data.componentType !== 'Embed')
      this.props.updateComponent({id: this.props.id, newState: {content: e.target.innerHTML}})
  }

  handleInlineStyles = (type)=> {
   let styles = {
    margin: (type === 'Header1') ? '32px 0px 4px 0px' : (type==='Header2') ? '16px 0px 4px 0px' : ''
   }
   return styles
  }

  render(){
    let { data } = this.props
    let { showActionBtn, showHandle, isFocused } = this.state
    const isEdit = this.context.status === 'Edit'
    // console.log(this.state)
    return( 
      <PermissionContext.Consumer>
        {
          value => {
            const isEdit = value.status === 'Edit'
            const allActions = isEdit ? {
              'onMouseUp': this.handleMouseUp,
              'onMouseDown': this.onMouseDown,
              'onKeyDown': this.handleKeyDown,
              'data-component-type': data.componentType,
              'onBlur':this.handleBlur,
              'onInput':this.handleInput,
              'onFocus':this.handleFocus,
              'onMouseEnter':() => this.setState({showHandle: true}),
              'onMouseLeave':() => this.setState({showHandle: false}),
            } : {}
            return(
              <div 
                ref={node => this.elem = node} 
                className="widget-container" 
                data-block-id={this.props.id}
                style={this.handleInlineStyles(data.componentType)}
                {...allActions}
              >
                {isEdit && (showHandle || isFocused) && <DragHandle id={data.id} />}
                { React.cloneElement(this.props.children, { ...this.props.children.props, ...data }) }
                <CSSTransition
                  in={isEdit && showActionBtn}
                  timeout={300}
                  classNames="fade"
                  unmountOnExit
                >
                  <div className="text-type-tools" 
                    data-block-type="component-select-div" 
                    style={{display: showActionBtn && !['Divider', 'Upload'].includes(data.componentType)  ? 'flex' : 'none'}}
                  >
                    <div data-type="Header1">
                      <i className="cm-icon-h1" />
                    </div>
                    <div data-type="Header2">
                      <i className="cm-icon-h2" />
                    </div>
                    <div data-type="Olist" >
                      <i className="cm-icon-numbers" />
                    </div>
                    <div data-type="Ulist">
                      <i className="cm-icon-bullets" />
                    </div>
                    {/* <div>
                      <i className="cm-icon-page" />
                    </div> */}
                    <div data-type="Upload">
                      <i className="cm-icon-picture" />
                    </div>
                    <div data-type="Embed">
                      <i className="cm-icon-video" /> 
                    </div>
                    {/* <div data-type="Upload" onClick={this.handleTypeSelect}>
                      <i className="cm-icon-upload" /> 
                    </div> */}
                    <div data-type="Divider">
                      <i className="cm-icon-divider" />  
                    </div>
                  </div>
                </CSSTransition>
              </div>
            )
          }
          
        }
      </PermissionContext.Consumer>
    )
  }
}

const mapDispatchToProps = {
  addNewComponent,
  updateComponentType,
  removeComponent,
  setCurrentElem,
  removeCurrentElem,
  updateComponent
}
export default connect(state => state, mapDispatchToProps)(AddComponent)