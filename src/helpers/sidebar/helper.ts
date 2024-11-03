import store from "../../store/index";
import { SidebarItem } from "../../store/interfaces";
import utils from "../utils";

async function handleSidebarItemAsFileOnClick(invokeCommand: any, sidebarItem: SidebarItem) {
  store.commit("setCurrentOpeningFilesFromSidebar", sidebarItem);
  store.commit("setCurrentEditingFile", sidebarItem);
  await utils.readFileContent(invokeCommand, sidebarItem.fullPath);
}

function closeDir(sidebarItem: SidebarItem) {
  let sidebarItems: Array<SidebarItem> = store.state.sidebarItems;
  let sidebarItemIndex: number = sidebarItems.findIndex((item) => item.id === sidebarItem.id);
  let endIndex = sidebarItemIndex + 1;

  // Find the range of items that are children of the directory to close
  while (
    endIndex < sidebarItems.length &&
    sidebarItems[endIndex].layerLevel > sidebarItem.layerLevel
  ) {
    endIndex++;
  }
  // Remove the items that belong to the folder being closed
  sidebarItems.splice(sidebarItemIndex + 1, endIndex - sidebarItemIndex - 1);
  sidebarItems[sidebarItemIndex].dirOpened = false;

  store.commit("setSidebarItems", { items: sidebarItems });
}

function openDir(folderContents: Array<SidebarItem>, sidebarItem: SidebarItem) {
  /* 
  insert folderContents to sidebarItems right after sidebarItem
  */
  let sidebarItems: Array<SidebarItem> = store.state.sidebarItems;
  let index: number = sidebarItems.findIndex((item) => item.id === sidebarItem.id);

  let newSidebarItems = [
    ...sidebarItems.slice(0, index + 1),
    ...folderContents,
    ...sidebarItems.slice(index + 1),
  ];

  let targetItem = newSidebarItems.find((item) => item.id === sidebarItem.id);
  if (targetItem) {
    targetItem.dirOpened = true;
    targetItem.isFocus = true;
  }
  store.commit("setSidebarItems", { items: newSidebarItems });
}

async function handleSidebarItemAsDirOnClick(invokeCommand: any, sidebarItem: SidebarItem) {
  if (sidebarItem.dirOpened) {
    closeDir(sidebarItem);
  } else {
    let folderContents = await invokeCommand("read_folder_content", {
      folderPath: sidebarItem.fullPath,
      layerLevel: sidebarItem.layerLevel + 1,
    });
    openDir(folderContents, sidebarItem);
    store.commit("updateCurrentDirectory", sidebarItem.fullPath);
  }
}

export default {
  handleSidebarItemAsFileOnClick,
  handleSidebarItemAsDirOnClick,
};
