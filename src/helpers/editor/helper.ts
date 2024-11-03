import { Token } from "../../store/interfaces";
import { CursorRenderer } from "./render";
import { Cursor } from "./interfaces";
import store from "../../store/index";
import utils from "../utils";

export const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const LEADING_CHARS_2_KEY_BINDINGS = ["d", "g", "y", "c"];

function lineProcessing(tokens: Array<Token>): string {
  if (tokens.length == 0) {
    return `<span class="empty-line">A</span>`;
  }

  let processResult = tokens
    .map((token, i) => {
      const processedValue = token.value.replace(/ |\t/g, (match) => {
        if (match === " ") {
          return "&nbsp;";
        } else if (match === "\t") {
          return "&nbsp;&nbsp;&nbsp;&nbsp;";
        }
        return match;
      });
      return `<span style="color: ${token.color}">${processedValue}</span>`;
    })
    .join("");

  return processResult;
}

function processLineNumber(linesLength: number): string {
  let texts = new Array(linesLength);

  for (let i = 0; i < linesLength; i++) {
    texts[i] = `<div><span>${i + 1}</span></div>`;
  }
  return texts.join("");
}

function updateEditorAreaFontStyle(
  editorArea: HTMLDivElement | null,
  fontSize: string,
  fontWeight: string
) {
  if (editorArea) {
    editorArea.style.fontSize = fontSize;
    editorArea.style.fontWeight = fontWeight;
  }
}

function updateLineNumberAreaFontStyle(
  lineNumberArea: HTMLDivElement | null,
  fontSize: string,
  fontWeight: string
) {
  if (lineNumberArea) {
    lineNumberArea.style.fontSize = fontSize;
    lineNumberArea.style.fontWeight = fontWeight;
  }
}

function changeVimMode(
  mode: string,
  cursorProperties: Cursor | null = null,
  renderer: CursorRenderer | null = null
) {
  let allModes = ["insert", "normal", "commands", "selection", "commandErr"];
  if (!allModes.includes(mode)) return;

  if (cursorProperties) {
    cursorProperties.style = store.state.vimModeCursorStyle[mode];
  }
  if (renderer && cursorProperties) {
    renderer.render(cursorProperties);
  }
  store.commit("updateVimMode", mode);
}

function handleTotalLineNumbersChange(
  lineNumberDiv: HTMLDivElement,
  editorAreaDiv: HTMLDivElement
) {
  if (lineNumberDiv) {
    lineNumberDiv.innerHTML = processLineNumber(editorAreaDiv.querySelectorAll("div").length);
  }
}

function handleSaveFile(editor: any) {
  editor.ctrlSPressed = { ctrlPressed: true, sPressed: true };

  if (Object.keys(editor.currentEditingFile).length > 0) {
    utils.saveFile(editor.fileContentString.join("\n"), editor.$invokeTauriCommand);
  }
}

function handleSwitchTabBarItem(editor: any, keyPressed: string) {
  editor.ctrlNumberPressed = { ctrlPressed: true, numberPressed: true };
  let tabBarItemIndex = parseInt(keyPressed) - 1;

  for (let i = 0; i < editor.currentOpeningFiles.length; i++) {
    if (i === tabBarItemIndex) {
      let tabbarItem = document.getElementById(`tabbar-item-${editor.currentOpeningFiles[i].id}`);

      if (tabbarItem) {
        tabbarItem.click();
        break;
      }
    }
  }
}

function updateFileContentChanged(changed: boolean, editingFileId: string) {
  store.commit("updateFileContentChanged", {
    changed: changed,
    fileId: editingFileId,
  });
}

function calculateCursorSize(
  editorContainer: HTMLDivElement,
  editorStyle: { fontSize: string; fontWeight: string }
): { width: number; height: number } {
  // Create a temporary span element to measure width
  let tempSpan = document.createElement("span");
  tempSpan.style.cssText = `visibility: hidden; font-size: ${editorStyle.fontSize}; font-weight: ${editorStyle.fontWeight}; margin: 0;`;
  tempSpan.textContent = "a";

  // Create a container div for the line to measure height
  let tempLineDiv = document.createElement("div");
  tempLineDiv.style.fontSize = editorStyle.fontSize;
  tempLineDiv.style.fontWeight = editorStyle.fontWeight;
  tempLineDiv.appendChild(tempSpan);

  editorContainer.appendChild(tempLineDiv);

  // Get the width and height of the elements
  let width = tempSpan.getBoundingClientRect().width;
  let height = tempLineDiv.getBoundingClientRect().height;

  editorContainer.removeChild(tempLineDiv);
  return { width, height };
}

function calculateCursorMinPosition(
  scrollerElement: HTMLDivElement,
  canvasRect: DOMRect
): { x: number; y: number } | null {
  let lineDiv = scrollerElement.querySelector(".line-div");
  if (!lineDiv) return null;

  // Calculate minX and minY based on canvasRect offset
  let x = lineDiv.getBoundingClientRect().x - canvasRect.x;
  let y = lineDiv.getBoundingClientRect().y - canvasRect.y;

  return { x, y };
}

function addItemFileContentDOM(index: number, item: string) {
  store.commit("addItemToFileContentDOM", {
    index: index,
    item: item,
  });
}

function addItemFileContentString(editor: any, index: number, item: string) {
  editor.fileContentString = [
    ...editor.fileContentString.slice(0, index),
    item,
    ...editor.fileContentString.slice(index),
  ];
}

function removeItemFileContentString(editor: any, index: number) {
  editor.fileContentString = [
    ...editor.fileContentString.slice(0, index),
    ...editor.fileContentString.slice(index + 1),
  ];
}

function removeItemFileContentDOM(index: number) {
  store.commit("removeItemFromFileContentDOM", index);
}

function editItemFileContentDOM(index: number, newItem: string) {
  store.commit("editItemInFileContentDOM", {
    index: index,
    newItem: newItem,
  });
}

function adjustCursorAndCanvasLayout(editor: any): void {
  editor.cursor.properties.size = calculateCursorSize(
    editor.$refs["editorContainer"],
    editor.style
  );
  let scrollerEl = editor.$refs["scroller"].$el;
  editor.editorRect = scrollerEl.getBoundingClientRect();
  editor.editorCanvas.resize(editor.editorRect.width, editor.editorRect.height);
  editor.canvasRect = editor.editorCanvas.canvas.getBoundingClientRect();
  editor.cursor.properties.min = calculateCursorMinPosition(scrollerEl, editor.canvasRect);
}

function updateFileContentCaches(editor: any): void {
  editor.$invokeTauriCommand("update_file_content_cache", {
    filePath: editor.currentEditingFile.fullPath,
    lineContentsString: editor.fileContentString,
    lineContentsDom: editor.fileContentDOM,
  });
}

export default {
  processLineNumber,
  lineProcessing,
  updateEditorAreaFontStyle,
  updateLineNumberAreaFontStyle,
  changeVimMode,
  handleTotalLineNumbersChange,
  handleSaveFile,
  handleSwitchTabBarItem,
  updateFileContentChanged,
  calculateCursorSize,
  calculateCursorMinPosition,
  addItemFileContentDOM,
  addItemFileContentString,
  removeItemFileContentDOM,
  removeItemFileContentString,
  editItemFileContentDOM,
  adjustCursorAndCanvasLayout,
  updateFileContentCaches,
};
