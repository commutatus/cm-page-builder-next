import React from 'react'
import JSEMOJI from 'emoji-js';
import { Picker } from 'emoji-mart'
import { PermissionContext } from '../contexts/permission-context';
import classNames from "classnames";

export class EmojiIconContainer extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      showPopup: false
    }
    this.jsemoji = new JSEMOJI();
    this.jsemoji.img_sets.apple.path = 'https://cdn.jsdelivr.net/gh/iamcal/emoji-data@19299c91bc87374118f06b2760f1ced69d714ab1/img-apple-16/';
    this.jsemoji.img_sets.apple.sheet = 'https://cdn.jsdelivr.net/gh/iamcal/emoji-data@19299c91bc87374118f06b2760f1ced69d714ab1/img-apple-sheets-16/';
    this.jsemoji.use_sheet = true;
  }

  componentDidMount() {
    this.elem.innerHTML = this.jsemoji.replace_colons(this.props.emoji && this.props.emoji.colons || ':notebook_with_decorative_cover:')
  }

  onEmojiClick = (data, e) => {
    e.preventDefault()
    this.elem.innerHTML = this.jsemoji.replace_colons(data.colons)
    this.props.handleUpdate(null, { ...data }, 'emoji')
  }

  openEmojiPopup = (_e) => {
    if (!this.state.showPopup) {
      this.setState({ showPopup: true })
      document.addEventListener('click', this.closeEmojiPopup)
    }
  }

  closeEmojiPopup = (e) => {
    if (this.rootNode && !this.rootNode.contains(e.target)) {
      this.setState({ showPopup: false })
      document.removeEventListener('click', this.closeEmojiPopup)
    }
  }

  render() {
    let { showPopup } = this.state
    return (
      <PermissionContext.Consumer>
        {
          value => {
            return (
              <div
                className={classNames("cm-emoji-container", value.status.toLowerCase())}
                onClick={value.status === 'Edit' ? this.openEmojiPopup : undefined}
                ref={node => this.rootNode = node}
              >
                <div style={{ fontSize: '75px' }} ref={node => this.elem = node}></div>
                {
                  showPopup &&
                  <Picker set='apple' onClick={this.onEmojiClick} showPreview={false} />
                }
              </div>
            )
          }
        }
      </PermissionContext.Consumer>
    )
  }
}