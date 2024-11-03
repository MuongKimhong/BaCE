import helper from "./helper";
import editing from "./editing";
import moveKeys from "./move_keys";
import vimMovement from "./vim/movement";
import { NUMBER_KEYS, LEADING_CHARS_2_KEY_BINDINGS } from "./helper";
/*
editor: Editor Component ref
*/

function getCasedCharacter(event: KeyboardEvent): string {
  let key = event.key;

  if (/^[a-zA-Z]$/.test(key)) {
    let isShiftPressed = event.shiftKey;
    let isCapsLockActive = event.getModifierState("CapsLock");

    // Determine the case based on Shift and Caps Lock state
    return isShiftPressed !== isCapsLockActive ? key.toUpperCase() : key.toLowerCase();
  }

  return key;
}

function handleInsertCase(editor: any, event: KeyboardEvent): void {
  let keyPressed = event.key;

  if (moveKeys.isMoveKey(keyPressed)) {
    moveKeys.handleBasicMoveKeys(keyPressed, editor);
    return;
  }

  switch (keyPressed) {
    case "Tab": {
      editing.addTab(editor);
      return;
    }
    case "Escape": {
      let cursor = editor.cursor;
      helper.changeVimMode("normal", cursor.properties, cursor.renderer);
      return;
    }
    case "Enter": {
      editing.addNewLine(editor);
      return;
    }
    case "Backspace": {
      editing.deleteText(editor);
      return;
    }
    default: {
      let isPrintableCharacter = keyPressed.length === 1;

      if (isPrintableCharacter) {
        let key = getCasedCharacter(event);
        editing.addNewText(key, editor);
        return;
      }
    }
  }
}

function handleCommandErrCase(keyPressed: string, cursor: any): void {
  if (keyPressed === "Escape") {
    helper.changeVimMode("normal", cursor.properties, cursor.renderer);
  }
}

// prettier-ignore
function handleNormalCase(editor: any, event: KeyboardEvent): void {
  if (editor.currentOpeningFiles.length > 0) {

    // detect 2 key binding, like gg, dd, yy, etc....
    if (editor.lastKey && LEADING_CHARS_2_KEY_BINDINGS.includes(event.key)) {
      editor.lastKey = editor.lastKey + event.key;
      clearTimeout(editor.timeout);

      if (vimMovement.isVimTwoCharsMoveKeys(editor.lastKey)) {
        vimMovement.handleVimTwoCharsMoveKeys(editor);
        editor.lastKey = null;
      }
    } 
    else if (LEADING_CHARS_2_KEY_BINDINGS.includes(event.key)) {
      editor.lastKey = event.key;
      editor.timeout = setTimeout(() => {
        editor.lastKey = null;
      }, 500);
    } 
    else if (vimMovement.isVimSingleCharMoveKeys(event.key)) {
      vimMovement.handleVimSingleCharMoveKeys(event.key, editor);
    } 
    else if (event.key === "i") {
      let cursor = editor.cursor;
      helper.changeVimMode("insert", cursor.properties, cursor.renderer);
    } 
    else if (event.key === ":") {
      helper.changeVimMode("commands");
    }
  }
}

// prettier-ignore
function handleCtrlKeyPressed(editor: any, event: KeyboardEvent): void {
  if (event.ctrlKey && event.key === "Tab") {
    if (editor.isActive) editor.$emit("switchActiveToSidebar");
  } 
  else if (event.ctrlKey && event.key === "s") {
    helper.handleSaveFile(editor);
  } 
  else if (event.ctrlKey && NUMBER_KEYS.includes(event.key)) {
    helper.handleSwitchTabBarItem(editor, event.key);
  }
}

export default {
  handleInsertCase,
  handleCommandErrCase,
  handleNormalCase,
  handleCtrlKeyPressed,
};
