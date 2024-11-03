import { Application, Graphics } from "pixi.js";
import { Cursor } from "./interfaces";
import store from "../../store/index";

/*
Font family inside editor canvas is required to be fix size in width and height.
Currently, only monospace font being used
*/

export class CursorRenderer {
  editor: Application;
  cursorBox: Graphics;

  constructor(editor: Application, cursorBox: Graphics, cursorProp: Cursor) {
    this.editor = editor;
    this.cursorBox = cursorBox;
    this.initialRender(cursorProp);
  }
  render(cursorProp: Cursor) {
    this.cursorBox.clear();
    this.cursorBox.fill({
      color: cursorProp.style.backgroundColor,
      alpha: cursorProp.style.opacity,
    });
    this.cursorBox.rect(0, 0, cursorProp.size.width, cursorProp.size.height);
    this.cursorBox.position.set(cursorProp.position.x, cursorProp.position.y);
    this.cursorBox.fill();
  }

  initialRender(cursorProp: Cursor) {
    this.render(cursorProp);
    this.editor.stage.addChild(this.cursorBox);
  }

  move(cursorProp: Cursor) {
    this.cursorBox.position.x = cursorProp.position.x;
    this.cursorBox.position.y = cursorProp.position.y;
  }

  clear() {
    this.cursorBox.clear();
  }
}

function destroyCursorRenderer(editor: any): void {
  /*
  cursor: Editor's data cursor object
  */
  if (editor.cursor.renderer) editor.cursor.renderer.clear();

  editor.cursor = {
    properties: {
      size: { width: 0, height: 0 },
      position: { x: 0, y: 0 }, // position relative to canvas
      style: store.state.vimModeCursorStyle.normal,
      row: 0, // current line
      column: 0, // current character in current line
      min: { x: 0, y: 0 },
    },
    renderer: null,
    initialized: false,
  };
}

function resetCursor(editor: any): void {
  editor.cursor.properties.position = {
    x: editor.cursor.properties.min.x,
    y: editor.cursor.properties.min.y,
  };
  editor.cursor.properties.row = 0;
  editor.cursor.properties.column = 0;
}

function initCursorRenderer(editor: any): void {
  /*
  cursor: Editor's data cursor object
  */
  let cursorBox = new Graphics();
  editor.cursor.properties.position = {
    // avoid ref copy
    x: editor.cursor.properties.min.x,
    y: editor.cursor.properties.min.y,
  };
  editor.cursor.renderer = new CursorRenderer(
    editor.editorCanvas,
    cursorBox,
    editor.cursor.properties
  );
  editor.cursor.initialized = true;
}

export default {
  CursorRenderer,
  resetCursor,
  initCursorRenderer,
  destroyCursorRenderer,
};
