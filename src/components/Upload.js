import React from 'react'
import '../styles/components/Upload.css';
import withComponent from './withComponent'
class WrappedUpload extends React.Component{

  render() {
    let {image} = this.props
    return(
      <div className="cm-uploader" onClick={() => this.fileInputElem.click()}>
        {
          image
          ?
          <img src={image.url} width="100%" height="400px" alt={image.filename} />
          :
          <React.Fragment>
            <span><i className="cm-upload" /></span>
            Click to upload file
            <input ref={node => this.fileInputElem = node} type="file" accept="image/*" hidden onChange={this.props.uploadImage} />
          </React.Fragment>
        }
      </div>
    )
  }
}

export const Upload = withComponent(WrappedUpload)

