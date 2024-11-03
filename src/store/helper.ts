import { State, SidebarItem, Settings } from "./interfaces";

function removeFileFromCurrentOpeningFiles(state: State, itemId: string): void {
  let index = state.currentOpeningFiles.findIndex((file) => file.id === itemId);
  if (index !== -1) {
    state.currentOpeningFiles.splice(index, 1);
  }
  if (state.currentOpeningFiles.length == 0) {
    state.currentEditingFile = {} as SidebarItem;
    state.fileContentString = [] as string[];
  }
}

function removeFocusFromSidebarItem(state: State, itemId: string): void {
  let item = state.sidebarItems.find((item) => item.id === itemId);
  if (item) {
    item.isFocus = false;
  }
}

function updateSidebarItemsFocusState(state: State, currentItem: SidebarItem): void {
  state.sidebarItems.forEach((item) => {
    item.isFocus = item.id === currentItem.id;
  });
}

function updateCurrentOpeningFilesFocusState(state: State, currentItem: SidebarItem): void {
  state.currentOpeningFiles.forEach((file) => {
    file.isFocus = file.id === currentItem.id;
  });
}

export default {
  removeFileFromCurrentOpeningFiles,
  removeFocusFromSidebarItem,
  updateSidebarItemsFocusState,
  updateCurrentOpeningFilesFocusState,
};
