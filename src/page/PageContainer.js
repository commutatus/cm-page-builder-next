import React from "react";
import Sortable, { active } from "sortablejs";
import PropTypes from "prop-types";
import { CSSTransition } from "react-transition-group";
import { connect } from "react-redux";
import Helmet from "react-helmet";
import { PermissionContext } from "../contexts/permission-context";
import { PageDetails } from "./PageDetails";
import AddComponent from "../components/AddComponent";
import {
  initComponents,
  addNewComponent,
  updatePosition,
  resetApp,
} from "../redux/reducers/appDataReducers";
import {
  setCurrentElem,
  removeCurrentElem,
} from "../redux/reducers/currentElemReducer";
import classNames from "classnames";
import Dropzone from "react-dropzone";

class PageContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      meta: props.meta,
      actionDomRect: null,
      activeFormatting: [],
    };
    this.currentListOrder = 1;
    this.shouldReload = props.status === "Read";
  }

  componentWillMount() {
    this.props.resetApp();
    this.initWindowVar(this.props);
    this.initApp(this.props);
    document.addEventListener("mousedown", this.removeFocus);
    // window.addEventListener('beforeunload', this.handlePageUnload)
  }

  componentWillReceiveProps(newProps) {
    if (newProps.meta && (!this.props.meta || `${newProps.meta.id}` !== `${this.props.meta.id}`)) {
      this.initWindowVar(newProps);
      this.initApp(newProps);
    }
    if (newProps.currentElem.elemId) {
      this.shouldReload = false;
    }
  }

  componentDidMount() {
    if (!this.dragContext) {
      let el = document.getElementById("component-list");
      this.dragContext = Sortable.create(el, {
        name: "componentList",
        handle: ".component-dragger",
        onEnd: (e) => {
          let { newIndex, oldIndex } = e;
          this.props.updatePosition({ oldIndex, newIndex });
        },
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    PageContainer.contextType = PermissionContext;

    let data = this.props.appData.componentData

    if (
      JSON.stringify(prevProps.appData.componentData) !== JSON.stringify(data)
    ) {
      this.props.updateComponentData(data);
    }

    //for formatting fix
    if (this.range && (prevState.activeFormatting.length !== this.state.activeFormatting.length)) {
      this.handleFormatting()

    }

  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.removeFocus);
    window.removeEventListener("beforeunload", this.handlePageUnload);
  }

  initWindowVar(props) {
    window.cmPageBuilder = {
      handleUpdate: props.handleUpdate,
      pid: props.meta && props.meta.id,
    };
  }

  initApp(props) {
    if (!props.newPage && props.meta && props.meta.id) {
      if (props.pageComponents.length > 0)
        this.props.initComponents(props.pageComponents);
      else if (this.props.status === "Edit") {
        this.props.addNewComponent({ componentType: "Text" });
      }
    }
  }

  checkPageHeight() {
    let pageElem = document.getElementById("page-builder");
    let commentElem = document.getElementById("page-comment-box");
    if (pageElem && commentElem) {
      let totalElemHeight =
        pageElem.scrollHeight +
        commentElem.offsetHeight +
        pageElem.getBoundingClientRect().top;
      if (totalElemHeight < window.innerHeight) {
        commentElem.style.bottom = 0;
      } else {
        commentElem.style.bottom = "unset";
      }
    }
  }


  emitUpdate = (...args) => {
    if (this.props.handleUpdate) {
      this.props.handleUpdate(...args);
    }
  };

  removeFocus = (e) => {
    //let conElem = document.querySelector(`[data-container-block="true"]`);
    //if (conElem && !conElem.contains(e.target)) {
    //  this.props.removeCurrentElem();
    //}
  };

  handlePageUnload = (e) => {
    if (!this.shouldReload) {
      this.shouldReload = true;
      this.props.removeCurrentElem();
      let barEl = document.getElementById("bar-text");
      if (barEl) barEl.innerHTML = "Changes saved.";
      e.preventDefault();
      e.returnValue = false;
    }
  };

  _getCurrentOrder = (currentIndex) => {
    const { appData } = this.props;
    if (typeof this._getCurrentOrder.counter === "undefined")
      this._getCurrentOrder.counter = 1;
    if (
      currentIndex > 0 &&
      appData.componentData[currentIndex - 1] &&
      appData.componentData[currentIndex - 1].componentType === `Olist`
    ) {
      this._getCurrentOrder.counter++;
    } else this._getCurrentOrder.counter = 1;
    return this._getCurrentOrder.counter;
  };

  getPageComponent = (data, index) => {
    let typeName = data.componentType;
    let dataId = data.id;
    if (typeName) {
      let customProp = typeName === "File" ? { file: true } : {}; // Send custom props to Upload component if the component type is File
      if (typeName === "Upload" || typeName === "File") {
        customProp = {
          ...customProp,
          progressInfo: this.props.progressInfo,
          assetBaseUrl: this.props.assetBaseUrl,
        };
      }

      typeName = typeName === "File" ? "Upload" : typeName;
      let Component = require(`../components/${typeName}`)[typeName];
      return (
        <AddComponent
          key={dataId}
          id={dataId}
          data={data}
          options={this.props.options}
        >
          <Component
            handleUpdate={this.emitUpdate}
            order={
              data.componentType === `Olist` && this._getCurrentOrder(index)
            }
            useDirectStorageUpload={this.props.useDirectStorageUpload}
            {...customProp}
          />
        </AddComponent>
      );
    }
  };

  handleMouseUp = (e) => {
    e.persist();
    if (e.target.dataset.action) {
      this.editText(e)
    } else {
      this.setState({ actionDomRect: null })
      let conElem = document.querySelector(`[data-container-block="true"]`);
      if (conElem.getBoundingClientRect().bottom < e.pageY) {
        let { appData } = this.props;
        let lastElem = appData.componentData[appData.componentData.length - 1];
        if (
          (!lastElem || lastElem.componentType !== "Text" || lastElem.content) &&
          !this.props.newPage
        ) {
          this.props.addNewComponent({
            id: lastElem && lastElem.id,
            componentType: "Text",
          });
        }
      }
    }

  };

  getScrollOffsets = () => {
    var w = window;

    // This works for all browsers except IE versions 8 and before
    if (w.pageXOffset != null) return { x: w.pageXOffset, y: w.pageYOffset };
    // For IE (or any browser) in Standards mode
    var d = w.document;
    if (document.compatMode == "CSS1Compat")
      return {
        x: d.documentElement.scrollLeft,
        y: d.documentElement.scrollTop,
      };
    // For browsers in Quirks mode
    return { x: d.body.scrollLeft, y: d.body.scrollTop };
  };

  handleSelection = (e) => {

    if (e.nativeEvent.type === 'selectionchange' && window.getSelection().getRangeAt(0).collapsed) {
      return
    }
    if (e.target.getAttribute("placeholder") !== `Title of the page`) {
      let selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let dimensions = selection.getRangeAt(0).getBoundingClientRect();
        this.currentElemSelection = { elemId: e.target.dataset.id, selection };
        if (dimensions.width > 1) {
          let scrollOffsets = this.getScrollOffsets();
          let actionDomRect = {
            top: dimensions.top + scrollOffsets.y - 30,
            left: dimensions.left + scrollOffsets.x,
          };

          this.saveSelection()

          this.setState({ actionDomRect, activeFormatting: this.getActiveFormatting(e), name: 'handleSelection' });
        }
      } else {
        this.currentElemSelection = null;
      }
    }

  };

  getActiveFormatting(e) {

    function getParentTilYoufindDiv(node) {
      if (node.nodeName === 'DIV') {
        return [node.nodeName]
      }
      return [node.nodeName, ...(getParentTilYoufindDiv(node.parentElement))]
    }

    const parentNodes = getParentTilYoufindDiv(this.range.commonAncestorContainer)

    const mapping = {
      'B': 'bold',
      'I': 'italic',
      'STRIKE': 'strikeThrough',
      'A': 'createLink'
    }

    return parentNodes.map(item => mapping[item]).filter(Boolean) || []

  }

  saveSelection() {
    let selectedRange = window.getSelection().getRangeAt(0)
    this.range = new Range()
    this.range.setStart(selectedRange.startContainer, selectedRange.startOffset)
    this.range.setEnd(selectedRange.endContainer, selectedRange.endOffset)
  }


  editText = (e) => {
    e.preventDefault();
    e.stopPropagation()
    const { activeFormatting } = this.state;
    let newActiveFormatting = []

    let action = e.target.dataset.action;

    if (activeFormatting.includes(action)) {
      newActiveFormatting = activeFormatting.filter(item => item != action)
    } else {
      newActiveFormatting = [...activeFormatting, action]
    }

    this.formatting = action
    this.setState({ activeFormatting: newActiveFormatting, name: 'editText' });
  };



  handleFormatting = () => {
    let { activeFormatting } = this.state;

    window.getSelection().removeAllRanges()
    window.getSelection().addRange(this.range)


    let action = this.formatting;
    switch (action) {
      case 'createLink':
        if (activeFormatting.includes(`createLink`)) {
          let link = prompt("Enter a link");
          let url = link ? link.split("//")[0] : "";
          if (url && url !== "http:" && url !== "https:") link = "http://" + link;
          document.execCommand(
            "insertHTML",
            false,
            `<a href=${link} target="_blank" >${window
              .getSelection()
              .toString()}</a>`
          );
        } else document.execCommand("unlink", false, false);
        break
      default:
        console.log(document.execCommand(action, false, null))
        break
    }
    this.formatting = null;
    this.saveSelection()
  }

  showTooltip = () => {
    this.setState({ showTooltip: true, name: 'showTooltip' });
  };

  hideTooltip = () => {
    this.setState({ showTooltip: false, name: 'hideTooltip' });
  };

  handleKeyDown = (e) => {
    if (!this.props.newPage) {
      if (e.key === "Enter" && e.target.dataset.root) {
        e.preventDefault();
        if (this.props.appData.componentData.length > 0)
          this.props.setCurrentElem(this.props.appData.componentData[0].id);
        else this.props.addNewComponent({ componentType: "Text" });
      }
    }
  };


  handleFileDrop = (acceptedFiles, rejectedFiles, event) => {
    const { appData, currentElem } = this.props;
    let id = null;
    let lastPosition = appData.componentData.length;
    let lastElem = appData.componentData[appData.componentData.length - 1];
    id = lastElem && lastElem.id;
    acceptedFiles.forEach((file) => {
      this.props.addNewComponent({
        id,
        componentType: file.type === "image/jpeg" ? "Upload" : "File",
        content: file,
      });
    });
    let pageElem = document.getElementById("page-builder");
    window.scroll({
      //Smooth scroll to bottom of page after file is added
      top: pageElem.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  };


  render() {
    const { meta, actionDomRect, activeFormatting, currentType } = this.state;
    const { appData } = this.props;
    let isEdit = this.props.status === "Edit";

    return (
      <Dropzone
        noClick
        noKeyboard
        // onDragEnter={this.handleFileDragEnter}
        // onDragLeave={this.handleFileDragLeave}
        onDrop={this.handleFileDrop}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            className={classNames("cm-page-builder")}
            style={isDragActive ? { pointerEvents: "none" } : {}}
            id="page-builder"
            {...getRootProps()}
            // style={this.props.newPage ? { marginTop: "50px" } : {}}
            onMouseUp={isEdit ? this.handleMouseUp : undefined}
            onSelect={isEdit ? this.handleSelection : undefined}
            onKeyDown={isEdit ? this.handleKeyDown : undefined}
          >
            <Helmet>
              <link rel="stylesheet" href="https://kit.fontawesome.com/4c31523976.css" crossorigin="anonymous" />
            </Helmet>
            <PermissionContext.Provider
              value={{ status: this.props.status, emitUpdate: this.emitUpdate }}
            >
              <PageDetails
                pageComponents={appData.componentData}
                emitUpdate={this.emitUpdate}
                meta={meta}
                getPageComponent={this.getPageComponent}
                requestHandler={this.props.requestHandler}
                pageCategories={this.props.pageCategories}
                currentOffices={this.props.currentOffices}
                isEditMode={isEdit}
                onMouseUp={isEdit ? this.handleMouseUp : undefined}
                showTitle={this.props.showTitle}
                showEmoji={this.props.showEmoji}
                showPageInfo={this.props.showPageInfo}
              />
            </PermissionContext.Provider>
            <CSSTransition
              in={
                actionDomRect &&
                actionDomRect.top &&
                isEdit &&
                currentType !== "Title of the page"
              }
              timeout={400}
              classNames="cm-p-builder-dropdown-fade"
              onEnter={this.showTooltip}
              onExited={this.hideTooltip}
              unmountOnExit
            >
              <div
                className={classNames("text-selection-tool")}
                id="cm-text-edit-tooltip"
                style={
                  actionDomRect
                    ? { top: actionDomRect.top, left: actionDomRect.left }
                    : { display: "none" }
                }
              >
                <div
                  className={classNames({
                    "bold-tool-btn-active": activeFormatting.includes(`bold`),
                    "bold-tool-btn": !activeFormatting.includes(`bold`)
                  })}
                  data-action="bold"
                  style={
                    ["Heading", "Subheading"].includes(currentType)
                      ? { cursor: "not-allowed" }
                      : {}
                  }
                >
                  B
                </div>
                <div
                  className={classNames({
                    "tool-btn-active": activeFormatting.includes(`italic`),
                    "tool-btn": !activeFormatting.includes(`italic`)
                  })}
                  data-action="italic"
                >
                  <i className={classNames("fa-sharp fa-solid fa-italic")} data-action="italic" />
                </div>
                <div
                  className={classNames({
                    "tool-btn-active": activeFormatting.includes(`strikeThrough`),
                    "tool-btn": !activeFormatting.includes(`strikeThrough`)
                  })}
                  data-action="strikeThrough"
                >
                  <i className={classNames("fa-sharp fa-strikethrough")} data-action="strikeThrough" />
                </div>
                <div
                  className={classNames({
                    "tool-btn-active": activeFormatting.includes(`createLink`),
                    "tool-btn": !activeFormatting.includes(`createLink`)
                  })}
                  data-action="createLink"

                >
                  <i className={classNames("fa-light fa-link")} data-action="createLink" />
                </div>
              </div>
            </CSSTransition>
          </div>
        )}
      </Dropzone>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    appData: state.appData,
    currentElem: state.currentElem,
  };
};

const mapDispatchToProps = {
  addNewComponent,
  initComponents,
  updatePosition,
  setCurrentElem,
  removeCurrentElem,
  resetApp,
};

const TYPE_MAP_COMPONENT = {
  header: "Header1",
  sub_header: "Header2",
  ordered_list: "Olist",
  unordered_list: "Ulist",
  text: "Text",
  page_link: "Text",
  video: "Embed",
  file: "Upload",
  image: "Upload",
  divider: "Divider",
};

PageContainer.propTypes = {
  handleUpdate: PropTypes.func.isRequired,
};

PageContainer.defaultProps = {
  handleUpdate: () => { return },
  status: "Edit",
  updateComponentData: (_data) => { return },
  typeMapping: TYPE_MAP_COMPONENT,
  // This method basically reverses the keys and the values of the provided type mapping constant
  REVERSE_TYPE_MAP_COMPONENT: Object.keys(TYPE_MAP_COMPONENT).reduce(
    (acc, key) => ({ ...acc, [TYPE_MAP_COMPONENT[key]]: key }),
    {}
  ),
  showTitle: false,
  showEmoji: false,
  showPageInfo: false,
  useDirectStorageUpload: false,
};

export default connect(mapStateToProps, mapDispatchToProps)(PageContainer);
