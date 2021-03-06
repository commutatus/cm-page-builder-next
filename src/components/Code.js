import React from 'react';
import hljs from 'highlight.js/lib/core';
import { PermissionContext } from '../contexts/permission-context';
import { connect } from 'react-redux';
import {
  updateComponent,
} from '../redux/reducers/appDataReducers'
import Select from './Select';
import classNames from "classnames";


const SUPPORTED_LANGUAGES = [
  'JavaScript',
  'JSON',
  'Bash',
  // 'C',
  // 'C#',
  // 'C++',
  'CSS',
  'CoffeeScript',
  'Dockerfile',
  'HTML',
  'Java',
  'Markdown',
  'PHP',
  'Plaintext',
  'Python',
  'R',
  'Ruby',
  'SCSS',
  'Shell',
  'Scala',
  'SQL',
  'Swift',
  'TypeScript',
  // 'VB.Net',
]

const DEFAULT_LANG = 'javascript'

hljs.configure({
  tabReplace: '\u00a0\u00a0\u00a0\u00a0',
  useBR: true
});

class CodeBlock extends React.Component {
  constructor(props) {
    super(props);
    this.registerLang(DEFAULT_LANG)
    this.state = {
      code: props.content || '',
      selectedLang: DEFAULT_LANG
    }
    CodeBlock.contextType = PermissionContext
  }

  registerLang(lang) {
    if (lang === 'html') lang = 'xml'
    hljs.registerLanguage(
      lang,
      require(`highlight.js/lib/languages/${lang}`)
    );
  }

  componentWillReceiveProps(newProps) {
    if (
      this.props.currentElem.id !== newProps.currentElem.id &&
      newProps.currentElem.elemId === newProps.id
    ) {
      this.highlighterNode.focus()
    }
  }

  componentDidUpdate(_oldProps, oldState) {
    if (
      this.state.code !== oldState.code &&
      this.state.selectedLang === oldState.selectedLang
    ) {
      if (this.oldCaretPos)
        this.restoreSelection(this.highlighterNode, this.oldCaretPos)
    }
  }

  saveSelection = (containerEl) => {
    if (window.getSelection && document.createRange) {
      let range = window.getSelection().getRangeAt(0);
      let preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(containerEl);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      let start = preSelectionRange.toString().length
      this.oldCaretPos = start + range.toString().length
    }
    else {
      let doc = containerEl.ownerDocument, win = doc.defaultView || doc.parentWindow;
      let selectedTextRange = doc.selection.createRange();
      let preSelectionTextRange = doc.body.createTextRange();
      preSelectionTextRange.moveToElementText(containerEl);
      preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
      let start = preSelectionTextRange.text.length;

      this.oldCaretPos = start + selectedTextRange.text.length
    }
  }

  restoreSelection = (containerEl, savedPos) => {
    if (window.getSelection && document.createRange) {
      let doc = containerEl.ownerDocument, win = doc.defaultView;
      let charIndex = 0, range = doc.createRange();
      range.setStart(containerEl, 0);
      range.collapse(true);
      let nodeStack = [containerEl], node, stop = false;

      while (!stop && (node = nodeStack.pop())) {
        if (node.nodeType == 3) {
          let nextCharIndex = charIndex + node.length;
          if (savedPos <= nextCharIndex) {
            range.setStart(node, savedPos - charIndex)
            range.setEnd(node, savedPos - charIndex)
            stop = true
          }
          charIndex = nextCharIndex;
        } else {
          let i = node.childNodes.length;
          while (i--) {
            nodeStack.push(node.childNodes[i]);
          }
        }
      }


      let sel = win.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      this.oldCaretPos = null
    }
    else {
      let doc = containerEl.ownerDocument;
      let textRange = doc.body.createTextRange();
      textRange.moveToElementText(containerEl);
      textRange.collapse(true);
      textRange.moveEnd("character", savedPos);
      textRange.moveStart("character", savedPos);
      textRange.select();
    }
  };

  handleLangChange = (selectedLang) => {
    this.registerLang(selectedLang)
    this.setState({ selectedLang })
  }


  handleKeyUp = (e) => {
    let text = e.target.innerText
    this.saveSelection(this.highlighterNode, text)
    this.setState(() => ({ code: text }))
  }

  handleKeyDown = e => {
    if (e.keyCode === 9) {
      e.preventDefault();

      // handleTab spaces by inserting a no break node
      //for more info https://www.fileformat.info/info/unicode/char/00a0/index.htm
      let editor = this.highlighterNode
      let doc = editor.ownerDocument.defaultView;
      let sel = doc.getSelection();
      let range = sel.getRangeAt(0);

      let tabNode = document.createTextNode("\u00a0\u00a0\u00a0\u00a0");
      range.insertNode(tabNode);

      range.setStartAfter(tabNode);
      range.setEndAfter(tabNode);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (e.key === 'Enter') {
      //By default when you press enter the brower creates a div.
      //append newline node when enter is pressed.
      e.preventDefault()

      let editor = this.highlighterNode
      let doc = editor.ownerDocument.defaultView;
      let sel = doc.getSelection();
      let range = sel.getRangeAt(0);

      let newlineNode = document.createTextNode("\n");
      range.insertNode(newlineNode);

      range.setStartAfter(newlineNode);
      range.setEndAfter(newlineNode);
      sel.removeAllRanges();
      sel.addRange(range);
      let text = e.target.innerText + '\n'
      this.saveSelection(this.highlighterNode, text)
      this.setState(() => ({ code: text }))
    }
  }

  handleBlur = (e) => {
    e.stopPropagation()
    this.props.updateComponent({ id: this.props.id, newState: { content: this.state.code } })
  }

  render() {
    const { code, selectedLang } = this.state
    const { context } = this

    const actions = context.status === 'Edit' ? {
      onKeyDown: this.handleKeyDown,
      onInput: this.handleChange,
      onKeyUp: this.handleKeyUp,
      onSelect: e => e.stopPropagation(),
      onBlur: this.handleBlur,
    } : {}

    return (
      <div
        className={classNames("cm-code-block", context.status.toLowerCase())}
        onClick={() => {
          this.highlighterNode.focus()
        }}
        onMouseUp={(e) => {
          e.stopPropagation()
        }}
      >
        <pre className={classNames('hljs')}>
          <code>
            <div
              style={{ width: '100%' }}
              contentEditable={context.status === 'Edit'}
              ref={node => this.highlighterNode = node}
              dangerouslySetInnerHTML={{
                __html: `${hljs.highlight(context.status === 'Edit' ? code : this.props.content,
                  {
                    language: selectedLang
                  }).value}`
              }}
              data-gramm_editor="false"
              {...actions}
            />
          </code>
        </pre>

        {
          context.status === 'Edit' &&
          <Select
            value={selectedLang}
            onSelect={this.handleLangChange}
            containerclassName={classNames("language-selector")}
            showArrow
          >
            {
              SUPPORTED_LANGUAGES.map(lang => {
                return (
                  <Select.Option
                    key={lang}
                    value={lang.toLowerCase()}
                  >
                    {lang}
                  </Select.Option>
                )
              })
            }
          </Select>
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currentElem: state.currentElem
})

const mapDispatchToProps = {
  updateComponent
}


export const Code = connect(mapStateToProps, mapDispatchToProps)(CodeBlock)