import React, { PureComponent } from 'react';
import { message } from 'antd';
import Editor, { useMonaco } from '@monaco-editor/react';
import { serialize, deserialize, prettierFormat, transformFunc } from '@/utils';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
interface IProps {
  value: any;
  type?: 'component' | 'vue';
  [key: string]: any;
}
// let obj = {
//   onClick: function test() {
//     console.log('test');
//     return 1;
//   }
// }

// let obj2 = serialize(obj)
// console.log("obj2", obj2, JSON.stringify(obj2))
// let obj3 = deserialize(obj2)
// console.log("obj3", obj3)

class CodeEditor extends PureComponent<IProps> {
  editorRef: any = null;
  CONFIG: any = this.props.type === 'component' ? `const config = ` : ``;

  handleFunction = (str: any, type: 'toFunction' | 'toString') => {
    if (!str) return str;
    if (type === 'toFunction') {
      // 字符串转function
      Object.keys(str).forEach((k: any) => {
        if (typeof str[k] === 'string' && str[k].startsWith('function ')) {
          // let { newFuncName, funcBody } = transformFunc(str[k])
          // str[k] = new Function(str[k])
          // str[k] = prettierFormat(str[k], 'babel');
          // console.log("str[k]", str[k])
          str[k] = str[k].replace(/\s/g, '&nbsp;');
          str[k] = str[k].replace(/\n/g, '<br/>');
        }
        if (Array.isArray(str[k])) {
          str[k].forEach((item: any) => this.handleFunction(item, type));
        }
        if (isObject(str[k])) {
          this.handleFunction(str[k], type);
        }
      });
    } else {
      Object.keys(str).forEach((k: any) => {
        if (isFunction(str[k])) {
          str[k] = str[k].toString();
        }
        if (Array.isArray(str[k])) {
          str[k].forEach((item: any) => this.handleFunction(item, type));
        }
        if (isObject(str[k])) {
          this.handleFunction(str[k], type);
        }
      });
    }
  };

  setEditorValue = (val: any) => {
    const { type } = this.props;
    if (type === 'component') {
      // this.handleFunction(val, 'toFunction')
      return `${this.CONFIG}${serialize(val, { space: 2, unsafe: true })}`;
      // let func =
      //   "function search() {\n                this.pagination.currentPage = 1;\n                this.queryList();\n              }"
      // return `${serialize(func, { space: 2, unsafe: true })}`;
    } else {
      return val;
    }
    // return type === 'component'
    //   ? `${this.CONFIG}${serialize(val, { space: 2, unsafe: true })}`
    //   : val;
  };

  getEditorValue = () => {
    const { type } = this.props;
    const value = this.editorRef.getValue().slice(this.CONFIG.length);
    try {
      const code = type === 'component' ? deserialize(value) : value;
      return code;
    } catch (e) {
      message.error(`JSON 格式错误`);
    }
  };

  onEditorDidMount = (editor: any, monaco: any) => {
    this.editorRef = editor;
    editor.onKeyDown((e: any) => {
      if (e.shiftKey) {
        this.editorRef &&
          this.editorRef.trigger(
            'auto completion',
            'editor.action.triggerSuggest',
          );
      }
    });
    editor.onDidChangeCursorPosition((e: any) => {
      const lineCount = editor.getModel().getLineCount();
      if (this.CONFIG) {
        if (e.position.lineNumber === 1) {
          editor.setPosition({
            lineNumber: 2,
            column: 1,
          });
        } else if (e.position.lineNumber === lineCount) {
          editor.setPosition({
            lineNumber: lineCount - 1,
            column: 1,
          });
        }
      }
    });
  };

  render() {
    const { value, type } = this.props;
    const language = type === 'component' ? `javascript` : `html`;
    return (
      <Editor
        height={`calc(100vh - ${100}px)`}
        language={language}
        onMount={this.onEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          renderSideBySide: false,
          overviewRulerBorder: false,
          tabSize: 2,
          // minimap: {
          //   enabled: false,
          // },
        }}
        value={this.setEditorValue(value)}
      />
    );
  }
}

export default CodeEditor;
