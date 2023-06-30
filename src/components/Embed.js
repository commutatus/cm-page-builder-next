import React from 'react'
import withComponent from './withComponent'
import { PermissionContext } from '../contexts/permission-context';
import { connect } from 'react-redux'
import { getVideoUrl } from '../utils/helpers'
import {
  updateComponent
} from '../redux/reducers/appDataReducers'
import classNames from "classnames";

class WrappedEmbed extends React.Component {

  constructor(props) {
    super(props)
    this.state = {}
    WrappedEmbed.contextType = PermissionContext
  }

  handleEmbed = (e) => {
    this.props.updateComponent({ id: this.props.id, newState: { content: getVideoUrl(e.target.value), initial: false } })
  }

  render() {
    let { content } = this.props
    let { context } = this
    let isEdit = context.status === 'Edit'
    return (
      <div className={classNames(
        classNames("component-section"), "cm-embed", context.status.toLowerCase(), { 'hover-effect-none': content }
      )}>
        {
          (content)
            ?
            <iframe
              title="video-frame"
              className={classNames(context.status.toLowerCase())}
              width="100%"
              height="320px"
              src={content}
            />
            :
            isEdit &&
            <div className={classNames("embed-input-field")}>
              <span className={classNames("embed-icon")}><i className={classNames("fa-light fa-clapperboard-play")} /></span>
              <input
                data-root="true"
                placeholder="Paste the URL from Vimeo or YouTube"
                className={classNames("embed-input")}
                onBlur={(e) => this.handleEmbed(e)}
              />
            </div>
        }
      </div>
    )
  }
}

const mapDispatchToProps = {
  updateComponent
}

export const Embed = withComponent(connect(null, mapDispatchToProps)(WrappedEmbed))
