import React from 'react'
import Page from './page'
import classNames from "classnames";
class App extends React.Component {

  render() {
    return (
      <div className={classNames("cm-editor")}>
        <div>
          <h1>Edit <span>(Click below to start editing...)</span></h1>
          <Page status={'Edit'} />
        </div>
        <div>
          <h1>Preview</h1>
          <Page status={'Read'} />
        </div>
      </div>
    )
  }
}
export default App