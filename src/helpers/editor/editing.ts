import {
  calculateCursorPosX,
  calculateCursorPosY,
  moveCursorHorizontal,
} from "../editor/move_keys";

import { EMPTY_LINE_SPAN } from "./vim/movement";
import { tokenize } from "./syntax/tokenize";
import helper from "./helper";

// prettier-ignore
function addNewLine(editor: any): void {
  let prop = editor.cursor.properties;
  let renderer = editor.cursor.renderer;
  let lineContent = editor.fileContentString[prop.row];

  let move = () => {
    prop.column = 0;
    prop.row += 1;
    prop.position.x = calculateCursorPosX(prop);
    prop.position.y = calculateCursorPosY(prop);
    renderer.move(prop);
  };

  let insertNewLineDiv = (row: number) => {
    move();
    helper.addItemFileContentDOM(row, EMPTY_LINE_SPAN);
    helper.addItemFileContentString(editor, row, "");
  };
  if (prop.column === 0) {
    insertNewLineDiv(prop.row); 
  }
  else if (prop.column > lineContent.length - 1) {
    insertNewLineDiv(prop.row + 1);
  }
  else {
    let splitOne = lineContent.slice(0, prop.column);
    let currentRow = prop.row;
    let newDOM = tokenize(splitOne);
    if (!newDOM) return;
    helper.editItemFileContentDOM(currentRow, newDOM);

    let splitTwo = lineContent.slice(prop.column).trim();
    newDOM = tokenize(splitTwo);
    if (!newDOM) return;
    helper.addItemFileContentDOM(prop.row + 1, newDOM);

    move(); 
    editor.fileContentString[currentRow] = splitOne;
    helper.addItemFileContentString(editor, prop.row, splitTwo);
  } 
  editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(
    editor.fileContentDOM.length
  );
}

function addNewText(newChar: string | null, editor: any): void {
  updateFileContent(newChar, editor);
  moveCursorHorizontal("right", editor);
}

function addTab(editor: any): void {
  let prop = editor.cursor.properties;
  updateFileContent("    ", editor);
  prop.column += 4;
  prop.position.x = calculateCursorPosX(prop);
  editor.cursor.renderer.move(prop);
}

// prettier-ignore
function deleteText(editor: any): void {
  let prop = editor.cursor.properties;

  if (prop.column > 0) {
    updateFileContent(null, editor);
    moveCursorHorizontal("left", editor);
  } 
  else if (prop.column === 0 && prop.row > 0) {
    let aboveLineContent = editor.fileContentString[prop.row - 1];
    let currentLineContent = editor.fileContentString[prop.row].trim();
    let newLineContent = `${aboveLineContent}${currentLineContent}`;

    let newDOM = tokenize(newLineContent);
    if (!newDOM) return;
    helper.editItemFileContentDOM(prop.row - 1, newDOM);
    helper.removeItemFileContentDOM(prop.row);

    prop.row -= 1;
    prop.column = aboveLineContent.length;
    prop.position.y = calculateCursorPosY(prop);
    prop.position.x = calculateCursorPosX(prop);
    editor.cursor.renderer.move(prop);

    editor.fileContentString[prop.row] = newLineContent;
    helper.removeItemFileContentString(editor, prop.row + 1);
    editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(editor.fileContentDOM.length);
  }
}

function updateFileContent(newChar: string | null, editor: any): void {
  let prop = editor.cursor.properties;
  let lineContent = editor.fileContentString[prop.row];
  let newContent: string;
  if (newChar) {
    newContent = lineContent.slice(0, prop.column) + newChar + lineContent.slice(prop.column);
  } else if (prop.column > 0) {
    newContent = lineContent.slice(0, prop.column - 1) + lineContent.slice(prop.column);
  } else {
    newContent = lineContent;
  }
  let newDOM = tokenize(newContent);
  if (!newDOM) return;

  helper.editItemFileContentDOM(prop.row, newDOM);
  editor.fileContentString[prop.row] = newContent;
}

export default {
  updateFileContent,
  addNewText,
  deleteText,
  addNewLine,
  addTab,
};
