const EDITOR_AREA_MARGIN_TOP = 10;
const EDITOR_AREA_MARGIN_BOTTOM = 10;

function isMoveKey(key: string): boolean {
  let keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  return keys.includes(key);
}

export function calculateCursorPosX(prop: any): number {
  return prop.min.x + prop.column * prop.size.width;
}

export function calculateCursorPosY(prop: any): number {
  return prop.min.y + prop.row * prop.size.height;
}

export function checkCursorPosXOnVerticalMove(prop: any, fileContentString: Array<string>): void {
  /* 
  when move up or down, if next line length is shorter then current line,
  move cursor horizontally to next line last characterjjjjjjjjjjjj;
  */

  if (prop.column > fileContentString[prop.row].length) {
    prop.column = fileContentString[prop.row].length;
    prop.position.x = prop.min.x + prop.column * prop.size.width;
  }
}

function isOutOfViewTop(lineRect: DOMRect, mainRect: DOMRect): boolean {
  return lineRect.top - lineRect.height - EDITOR_AREA_MARGIN_TOP <= mainRect.top;
}

function handleScrollTopOnCursorMove(
  lineRect: DOMRect,
  mainRect: DOMRect,
  scroller: HTMLDivElement
): void {
  scroller.scrollTop = mainRect.top - lineRect.top - EDITOR_AREA_MARGIN_TOP;
}

function isOutOfViewBottom(lineRect: DOMRect, mainRect: DOMRect, footbarRect: DOMRect): boolean {
  return lineRect.bottom + lineRect.height > mainRect.height - footbarRect.height;
}

function handleScrollDownOnCursorMove(lineDiv: HTMLDivElement, scroller: HTMLDivElement): void {
  scroller.scrollTop = lineDiv.offsetTop + lineDiv.offsetHeight;
}

export function updateCursorPosYOnScroll(prop: any, componentRefs: any, mainRect: DOMRect): void {
  let newLineRect = componentRefs[`line-${prop.row + 1}`].getBoundingClientRect();
  prop.position.y = newLineRect.top - mainRect.top - EDITOR_AREA_MARGIN_BOTTOM;
}

// prettier-ignore
export function moveCursorVertical(direction: string, editor: any): void {
  /* editor: Editor component */

  let prop = editor.cursor.properties;
  let scroller: HTMLDivElement;
 
  if (direction == "up") {
    if (prop.row <= 0) return;

    let line = editor.$refs[`line-${prop.row + 1}`];
    let lineRect = line.getBoundingClientRect();

    if (isOutOfViewTop(lineRect, editor.mainRect)) {
      scroller = editor.$refs["scroller"].$el;
      handleScrollTopOnCursorMove(lineRect, editor.mainRect, scroller);

      prop.row -= 1; 
      updateCursorPosYOnScroll(prop, editor.$refs, editor.mainRect);
    }
    else {
      prop.row -= 1;
      prop.position.y -= prop.size.height;
    }
  } 
  else {
    if (prop.row >= editor.fileContentString.length - 1) return;

    let line = editor.$refs[`line-${prop.row + 1}`];
    let lineRect = line.getBoundingClientRect();

    if (isOutOfViewBottom(lineRect, editor.mainRect, editor.footbarRect)) {
      scroller = editor.$refs["scroller"].$el;
      handleScrollDownOnCursorMove(line, scroller);

      prop.row += 1;
      updateCursorPosYOnScroll(prop, editor.$refs, editor.mainRect);
    }
    else {
      prop.row += 1;
      prop.position.y += prop.size.height;
    }
  }
  checkCursorPosXOnVerticalMove(prop, editor.fileContentString); 
  editor.cursor.renderer.move(prop);
}

export function moveCursorHorizontal(direction: string, editor: any): void {
  /* editor: Editor component */

  let prop = editor.cursor.properties;

  if (direction == "left") {
    if (prop.column <= 0) return;

    prop.column -= 1;
    prop.position.x -= prop.size.width;
  } else {
    if (prop.column >= editor.fileContentString[prop.row].length) return;

    prop.column += 1;
    prop.position.x += prop.size.width;
  }
  editor.cursor.renderer.move(prop);
}

function handleBasicMoveKeys(key: string, editor: any): void {
  switch (key) {
    case "ArrowUp": {
      moveCursorVertical("up", editor);
      break;
    }
    case "ArrowDown": {
      moveCursorVertical("down", editor);
      break;
    }
    case "ArrowLeft": {
      moveCursorHorizontal("left", editor);
      break;
    }
    case "ArrowRight": {
      moveCursorHorizontal("right", editor);
      break;
    }
  }
}

export default {
  isMoveKey,
  handleBasicMoveKeys,
};
