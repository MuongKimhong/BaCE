import { createStore } from "vuex";
import { SidebarItem, State, Settings } from "./interfaces";
import helper from "./helper";

const store = createStore({
  state: (): State => ({
    currentOpeningFiles: [] as SidebarItem[],
    currentEditingFile: {} as SidebarItem,
    currentDirectory: "",
    sidebarItems: [] as SidebarItem[],
    settings: {} as Settings,
    settingsPath: "",
    projectName: "",
    projectRootPath: "",
    hasFolderOpened: false,
    fileContentDOM: [] as string[],
    fileContentString: [] as string[], // Array of line which represent as string
    totalLines: 0,
    language: "",
    vimMode: "normal",
    vimModeCursorStyle: {
      insert: { backgroundColor: "white", opacity: 0.4 },
      normal: { backgroundColor: "white", opacity: 0.8 },
    },
    vimCommand: "",
    vimCommandErr: false,
  }),
  mutations: {
    setCurrentOpeningFilesFromSidebar(state: State, file: SidebarItem) {
      state.currentOpeningFiles = state.currentOpeningFiles
        .filter((fileItem) => fileItem.fullPath !== file.fullPath)
        .map((fileItem) => ({ ...fileItem, isFocus: false }));

      state.currentOpeningFiles.unshift({ ...file, isFocus: true });
    },

    setCurrentOpeningFilesFromTabbar(state: State, fileId: string) {
      state.currentOpeningFiles.forEach((file) => {
        file.isFocus = file.id === fileId;
      });
    },

    setCurrentEditingFile(state: State, file: SidebarItem) {
      state.currentEditingFile = file;
    },

    setSidebarItems(
      state: State,
      { items, focusFirstItem = false }: { items: Array<SidebarItem>; focusFirstItem?: boolean }
    ) {
      if (focusFirstItem) items[0].isFocus = true;
      state.sidebarItems = items;
    },

    addNewSidebarItem(state: State, payload: { item: SidebarItem; index: number | null }) {
      if (payload.index !== null) {
        state.sidebarItems.splice(payload.index, 0, payload.item);
      } else {
        state.sidebarItems.push(payload.item);
      }
    },

    setProjectName(state: State, folderPath: string) {
      let name = folderPath.split("/").pop();
      if (name) {
        state.projectName = name;
      }
    },

    setSidebarItemToFocus(state: State, selectedItemId: string) {
      for (let item of state.sidebarItems) {
        item.isFocus = item.id === selectedItemId ? true : false;
      }
    },

    setSettings(state: State, settingsConfig: Settings) {
      state.settings = settingsConfig;
    },

    setSettingsPath(state: State, path: string) {
      state.settingsPath = path;
    },

    setFileContent(
      state: State,
      payload: {
        fileContentString: Array<string>;
        fileContentDOM: Array<string>;
        language: string;
      }
    ) {
      state.fileContentDOM = payload.fileContentDOM;
      state.fileContentString = payload.fileContentString;
      state.language = payload.language;
    },

    updateFileContentString(state: State, newContentString: string[]) {
      state.fileContentString = newContentString;
    },

    addItemToFileContentDOM(state: State, payload: { index: number; item: string }) {
      state.fileContentDOM = [
        ...state.fileContentDOM.slice(0, payload.index),
        payload.item,
        ...state.fileContentDOM.slice(payload.index),
      ];
    },

    removeItemFromFileContentDOM(state: State, index: number) {
      state.fileContentDOM = [
        ...state.fileContentDOM.slice(0, index),
        ...state.fileContentDOM.slice(index + 1),
      ];
    },

    editItemInFileContentDOM(state: State, payload: { index: number; newItem: string }) {
      state.fileContentDOM[payload.index] = payload.newItem;
    },

    updateHasFolderOpened(state: State, opened: boolean) {
      state.hasFolderOpened = opened;
    },

    updateFileContentChanged(state: State, payload: { changed: boolean; fileId: string }) {
      let index = state.currentOpeningFiles.findIndex((file) => file.id == payload.fileId);
      if (index !== -1) {
        state.currentOpeningFiles[index].fileContentChanged = payload.changed;
      }
    },

    updateVimMode(state: State, mode: string) {
      state.vimMode = mode;
    },

    updateVimCommand(state: State, command: string) {
      state.vimCommand = command;
    },

    updateCurrentDirectory(state: State, dirFullPath: string) {
      state.currentDirectory = dirFullPath;
    },

    updateProjectRootPath(state: State, path: string) {
      state.projectRootPath = path;
    },

    updateVimCommandErr(state: State, err: boolean) {
      state.vimCommandErr = err;
    },

    tabBarItemOnClickStateChange(state: State, clickedItem: SidebarItem) {
      state.currentEditingFile = clickedItem;
      helper.updateCurrentOpeningFilesFocusState(state, clickedItem);
      helper.updateSidebarItemsFocusState(state, clickedItem);
    },
    tabBarItemCloseStateChange(state: State, itemId: string) {
      helper.removeFileFromCurrentOpeningFiles(state, itemId);
      helper.removeFocusFromSidebarItem(state, itemId);
    },
  },
});

export default store;
