import React from 'react'
import { PermissionContext } from '../contexts/permission-context';
import classNames from "classnames";

export const Divider = () => {
  return (
    <PermissionContext.Consumer>
      {
        value =>
          <div className={classNames("component-section", value.status.toLowerCase())}>
            <div className={classNames("divider", value.status.toLowerCase())}>
              <div className={classNames("separator")}></div>
            </div>
          </div>

      }
    </PermissionContext.Consumer>
  )
}
