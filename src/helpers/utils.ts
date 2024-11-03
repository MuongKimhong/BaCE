import store from "../store/index";
import helper from "./editor/helper";
import { Settings } from "../store/interfaces";

function setLineNumber(totalLines: number): void {
  let lineNumberDOM = document.getElementById("line-number");
  if (lineNumberDOM) {
    lineNumberDOM.innerHTML = helper.processLineNumber(totalLines);
  }
}

function setFileContent(
  contentString: Array<string>,
  contentDOM: Array<string>,
  lang: string
): void {
  store.commit("setFileContent", {
    fileContentString: contentString,
    fileContentDOM: contentDOM,
    language: lang,
  });
}

async function readFileContent(invokeCommand: any, filePath: string): Promise<void> {
  try {
    let res = await invokeCommand("read_file_content", {
      filePath: filePath,
    });
    let totalLines = 0;

    if (res.line_contents_string.length == 0) {
      setFileContent([""], [`<span class="empty-line">A</span>`], res.language);
      totalLines = 1;
    } else {
      setFileContent(res.line_contents_string, res.line_contents_dom, res.language);
      totalLines = res.line_contents_dom.length;
    }
    setLineNumber(totalLines);
  } catch (e) {
    throw new Error(`Failed to read file content`);
  }
}

async function readFolderContent(
  invokeCommand: any,
  folderPath: string,
  focusFirstItem: boolean,
  layerLevel: number
): Promise<void> {
  try {
    let res = await invokeCommand("read_folder_content", {
      folderPath: folderPath,
      layerLevel: layerLevel,
    });
    store.commit("setSidebarItems", { items: res, focusFirstItem: focusFirstItem });
    store.commit("updateHasFolderOpened", true);
    store.commit("setProjectName", folderPath);
    store.commit("updateCurrentDirectory", folderPath);
    store.commit("updateProjectRootPath", folderPath);
  } catch (_) {
    throw new Error(`Failed to read folder content`);
  }
}

function getRandomString(length: number) {
  let random = Math.random().toString(36);
  random = random.substring(2, 2 + length);
  let timestampPart = Date.now().toString(36).substring(0, length);
  return random + timestampPart;
}

async function saveFile(contentText: string, invokeCommand: any, filePath: string | null = null) {
  let editingFile = store.state.currentEditingFile;

  let saveResult = await invokeCommand("save_file", {
    filePath: filePath && filePath.trim() !== "" ? filePath : editingFile.fullPath,
    content: contentText,
  });

  if (saveResult === "success") {
    if (store.state.settingsPath === editingFile.fullPath) {
      invokeCommand("read_setting_configs").then((settings: Settings) => {
        store.commit("setSettings", settings);
      });
    }
    helper.updateFileContentChanged(false, editingFile.id);
  }
}

export default {
  readFileContent,
  readFolderContent,
  getRandomString,
  saveFile,
};
