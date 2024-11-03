import {
  moveCursorVertical,
  moveCursorHorizontal,
  checkCursorPosXOnVerticalMove,
  calculateCursorPosX,
  calculateCursorPosY,
  updateCursorPosYOnScroll,
} from "../move_keys";

import helper from "../helper";
import { tokenize } from "../syntax/tokenize";

// prettier-ignore
const VIM_SINGLE_CHAR_MOVE_KEYS = [
  "h", "j", "k", "l", "w", "b", "O", "A", "I", "o",
  "{", "}", "G", "p"
];
const VIM_TWO_CHARS_MOVE_KEYS = ["gg", "dd", "yy", "cc"];
export const EMPTY_LINE_SPAN = `<span class="empty-line">A</span>`;

function isVimSingleCharMoveKeys(key: string): boolean {
  return VIM_SINGLE_CHAR_MOVE_KEYS.includes(key);
}

function isVimTwoCharsMoveKeys(key: string): boolean {
  return VIM_TWO_CHARS_MOVE_KEYS.includes(key);
}

function moveRightBeginningWord(editor: any): void {
  let prop = editor.cursor.properties;
  let line = editor.fileContentString[prop.row];

  for (let i = prop.column + 1; i < line.length; i++) {
    if (line[i].trim() === "") {
      prop.column = i + 1;
      prop.position.x = calculateCursorPosX(prop);
      editor.cursor.renderer.move(prop);
      return;
    }
  }
}

function moveLeftBeginningWord(editor: any): void {
  let prop = editor.cursor.properties;
  let line = editor.fileContentString[prop.row];
  let foundFirstSpace = false;

  const move = (prop: any) => {
    prop.position.x = calculateCursorPosX(prop);
    editor.cursor.renderer.move(prop);
  };

  for (let i = prop.column - 1; i > 0; i--) {
    if (line[i].trim() === "") {
      foundFirstSpace = true;
      prop.column = i;
      break;
    }
  }
  if (foundFirstSpace) {
    for (let i = prop.column - 1; i > 0; i--) {
      if (line[i].trim() === "") {
        prop.column = i + 1;
        move(prop);
        return;
      }
    }
  }
  prop.column = 0;
  move(prop);
}

function moveBeginningLine(editor: any): void {
  let prop = editor.cursor.properties;
  let line = editor.fileContentString[prop.row];
  for (let i = 0; i < line.length; i++) {
    if (line[i].trim() != "") {
      prop.column = i;
      prop.position.x = calculateCursorPosX(prop);
      helper.changeVimMode("insert", prop, editor.cursor.renderer);
      break;
    }
  }
}

function moveEndLine(editor: any): void {
  let prop = editor.cursor.properties;
  let line = editor.fileContentString[prop.row];
  prop.column = line.length;
  prop.position.x = calculateCursorPosX(prop);
  helper.changeVimMode("insert", prop, editor.cursor.renderer);
}

function insertEmptyLineUp(editor: any): void {
  /* insert empty line to current line, keep cursor at empty line */

  let prop = editor.cursor.properties;
  helper.addItemFileContentDOM(prop.row, EMPTY_LINE_SPAN);
  helper.addItemFileContentString(editor, prop.row, "");
  prop.column = 0;
  prop.position.x = calculateCursorPosX(prop);
  helper.changeVimMode("insert", prop, editor.cursor.renderer);
  editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(editor.fileContentDOM.length);
}

function insertEmptyLineBelow(editor: any): void {
  // how many leading white spaces below line has?
  let prop = editor.cursor.properties;

  if (prop.row >= editor.fileContentString.length - 1) {
    helper.addItemFileContentDOM(prop.row + 1, EMPTY_LINE_SPAN);
    helper.addItemFileContentString(editor, prop.row + 1, "");
    prop.column = 0;
  } else {
    let belowLineLeadingSpaces = 0;
    let belowLine = editor.fileContentString[prop.row + 1];

    for (let i = 0; i < belowLine.length; i++) {
      if (belowLine[i].trim() !== "") break;
      belowLineLeadingSpaces += 1;
    }
    let text = " ".repeat(belowLineLeadingSpaces);
    let newDOM = tokenize(text);
    if (!newDOM) return;
    helper.addItemFileContentDOM(prop.row + 1, newDOM);
    helper.addItemFileContentString(editor, prop.row + 1, text);

    /* -----
    current-line div
    new-empty-line div <--- insertBefore another-line div which has index current-row + 1
    another-line div
    ------ */

    prop.column = belowLineLeadingSpaces;
  }
  prop.position.x = calculateCursorPosX(prop);
  moveCursorVertical("down", editor);
  helper.changeVimMode("insert", prop, editor.cursor.renderer);
  editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(editor.fileContentDOM.length);
}

export function updateCursorPosScrollToIndex(prop: any, editor: any, mainRect: DOMRect): void {
  requestAnimationFrame(() => {
    updateCursorPosYOnScroll(prop, editor.$refs, mainRect);
    prop.position.x = calculateCursorPosX(prop);
    editor.cursor.renderer.move(prop);
  });
}

// go to empty line above or below
function moveUpDownEmptyLine(direction: string, editor: any): void {
  let prop = editor.cursor.properties;
  let moveToRow: number | null = null;
  let scroller = editor.$refs["scroller"];

  if (direction === "up") {
    if (prop.row === 0) return;

    for (let i = prop.row - 1; i >= 0; i--) {
      if (editor.fileContentString[i].trim() === "") {
        moveToRow = i;
        if (!moveToRow) return;

        scroller.scrollToIndex(moveToRow);
        prop.row = moveToRow;
        prop.column = 0;

        // need one more requestAnimationFrame to fully wait for rendering
        requestAnimationFrame(() => {
          updateCursorPosScrollToIndex(prop, editor, editor.mainRect);
        });
        break;
      }
    }
  } else {
    for (let i = prop.row + 1; i < editor.fileContentString.length; i++) {
      if (editor.fileContentString[i].trim() === "") {
        moveToRow = i;
        if (!moveToRow) return;

        scroller.scrollToIndex(moveToRow);
        prop.row = moveToRow;
        prop.column = 0;
        updateCursorPosScrollToIndex(prop, editor, editor.mainRect);
        break;
      }
    }
  }
}

function moveFirstOrLastLine(line: string = "first", editor: any): void {
  let row = 0;

  if (line === "last") {
    row = editor.fileContentString.length - 1;
  }
  let prop = editor.cursor.properties;
  let scroller = editor.$refs["scroller"];

  prop.row = row;
  prop.column = 0;
  scroller.scrollToIndex(prop.row);
  requestAnimationFrame(() => {
    updateCursorPosScrollToIndex(prop, editor, editor.mainRect);
  });
}

// prettier-ignore
function pasteLine(editor: any): void {
  let prop = editor.cursor.properties;
  let newDOM = tokenize(editor.copiedText);
  if (!newDOM) return;
  let index = 0;

  if (prop.row >= editor.fileContentString.length) {
    index = editor.fileContentString.length - 1
    editor.fileContentString.push(editor.copiedText);
  }
  else {
    index = prop.row;
    helper.addItemFileContentString(editor, prop.row, editor.copiedText);
  }
  helper.addItemFileContentDOM(index, newDOM);

  let leadingSpacesCount = editor.copiedText.match(/^\s*/)?.[0].length || 0
  prop.column = leadingSpacesCount;
  prop.position.x = calculateCursorPosX(prop);
  moveCursorVertical("down", editor);

  editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(editor.fileContentDOM.length);
}

// prettier-ignore
function deleteLine(editor: any): void {
  let prop = editor.cursor.properties;
  copyLine(editor);

  if (prop.row === 0 && editor.fileContentString.length == 1) {
    editor.fileContentString[prop.row] = "";
    helper.editItemFileContentDOM(prop.row, EMPTY_LINE_SPAN);
    prop.column = 0;
    prop.position.x = calculateCursorPosX(prop);
  } 
  else if (prop.row === editor.fileContentString.length - 1) {
    helper.removeItemFileContentDOM(prop.row);
    helper.removeItemFileContentString(editor, prop.row);
    prop.row -= 1;
    prop.position.y = calculateCursorPosY(prop);
  } 
  else {
    helper.removeItemFileContentDOM(prop.row);
    helper.removeItemFileContentString(editor, prop.row);
    checkCursorPosXOnVerticalMove(prop, editor.fileContentString);
  }
  editor.cursor.renderer.move(prop);
  editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(editor.fileContentDOM.length);
}

function copyLine(editor: any): void {
  editor.isLineCopy = true;
  editor.copiedText = editor.fileContentString[editor.cursor.properties.row];
}

function cutLineAndEnterInsertMode(editor: any): void {
  let prop = editor.cursor.properties;
  copyLine(editor);

  let lineText = editor.fileContentString[prop.row];
  let leadingSpacesCount = lineText.match(/^\s*/)?.[0].length || 0;

  editor.fileContentString[prop.row] = " ".repeat(leadingSpacesCount);
  let newDOM = tokenize(" ".repeat(leadingSpacesCount));
  if (!newDOM) return;
  helper.editItemFileContentDOM(prop.row, newDOM);

  prop.column = Math.max(0, leadingSpacesCount - 1);
  prop.position.x = calculateCursorPosX(prop);
  helper.changeVimMode("insert", prop, editor.cursor.renderer);

  editor.$refs["lineNumber"].innerHTML = helper.processLineNumber(editor.fileContentDOM.length);
}

// prettier-ignore
function handleVimSingleCharMoveKeys(key: string, editor: any): void {
  switch (key) {
    case "k": {
      moveCursorVertical("up", editor);
      break;
    }
    case "j": {
      moveCursorVertical("down", editor);
      break;
    }
    case "h": {
      moveCursorHorizontal("left", editor);
      break;
    }
    case "l": {
      moveCursorHorizontal("right", editor);
      break;
    }
    case "w": {
      moveRightBeginningWord(editor);
      break;
    }
    case "b": {
      moveLeftBeginningWord(editor);
      break;
    }
    case "A": {
      moveEndLine(editor);
      break;
    }
    case "I": {
      moveBeginningLine(editor);
      break;
    }
    case "O": {
      insertEmptyLineUp(editor);
      break;
    }
    case "o": {
      insertEmptyLineBelow(editor);
      break;
    }
    case "{": {
      moveUpDownEmptyLine("up", editor);
      break;
    }
    case "}": {
      moveUpDownEmptyLine("down", editor);
      break;
    }
    case "G": {
      moveFirstOrLastLine("last", editor);
      break;
    }
    case "p": {
      if (editor.isLineCopy && editor.copiedText.trim() !== "") {
        pasteLine(editor);
      }
      break;
    }
  }
}

function handleVimTwoCharsMoveKeys(editor: any): void {
  switch (editor.lastKey) {
    case "gg": {
      moveFirstOrLastLine("first", editor);
      break;
    }
    case "dd": {
      deleteLine(editor);
      break;
    }
    case "yy": {
      copyLine(editor);
      break;
    }
    case "cc": {
      cutLineAndEnterInsertMode(editor);
      break;
    }
  }
}

export default {
  isVimSingleCharMoveKeys,
  isVimTwoCharsMoveKeys,
  handleVimSingleCharMoveKeys,
  handleVimTwoCharsMoveKeys,
};
