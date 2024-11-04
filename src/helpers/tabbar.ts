import { SidebarItem } from "../store/interfaces";
import store from "../store/index";

/* tabItem: TabbarItem component ref */

async function showCloseTabConfirmDialog(tabItem: any): Promise<void> {
  let msg = `There's unsaved changes for ${tabItem.name} file. Are you sure you want to close this file?`;
  let answer = await tabItem.$dialogAsk(msg, {
    title: "BaCE",
    kind: "warning",
  });

  if (answer) {
    try {
      await closeTabWithoutSave(tabItem);
    } catch (e) {
      throw new Error(`Fail to close tab: ${e.message}`);
    }
  }
}

async function closeTabWithoutSave(tabItem: any): Promise<void> {
  try {
    await tabItem.$invokeTauriCommand("delete_file_content_cache", {
      filePath: tabItem.fullPath,
    });
    closeTabItem(tabItem);
  } catch (_) {
    throw new Error("Fail to delete content cache");
  }
}

function findNearByFile(tabItem: any): SidebarItem | null {
  /*
    move focus to nearby (index - 1) if available, else (index + 1)
  */
  let openingFiles = store.state.currentOpeningFiles;

  for (let [index, file] of openingFiles.entries()) {
    if (file.id === tabItem.id) {
      return openingFiles[index - 1] || openingFiles[index + 1];
    }
  }
  return null;
}

function closeTabItem(tabItem: any): void {
  if (tabItem.isFocus) {
    if (store.state.currentOpeningFiles.length >= 2) {
      tabItem.moveFocusToNearByFile();
    }
  }
  store.commit("tabBarItemCloseStateChange", tabItem.id);
}

function setHoverTextPosition(left: number, top: number, tabItem: any): void {
  let hoverTextStyle = tabItem.$refs["hoverText"].style;
  hoverTextStyle.left = `${left + 6}px`;
  hoverTextStyle.top = `${top + 6}px`;
}

export default {
  showCloseTabConfirmDialog,
  closeTabWithoutSave,
  findNearByFile,
  setHoverTextPosition,
  closeTabItem,
};
