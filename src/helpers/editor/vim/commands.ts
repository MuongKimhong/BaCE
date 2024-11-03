import { SidebarItem } from "../../../store/interfaces";
import store from "../../../store/index";
import helper from "../helper";
import utils from "../../utils";

function closeTabBarItem(fileId: string) {
  let tabBarItemCloseBtn = document.getElementById(`close-btn-${fileId}`);
  if (tabBarItemCloseBtn) tabBarItemCloseBtn.click();
}

async function executeVimCommand(command: string, editor: any) {
  switch (command) {
    case "w": {
      await utils.saveFile(editor.fileContentString.join("\n"), editor.$invokeTauriCommand);
      break;
    }
    case "q": {
      closeTabBarItem(editor.currentEditingFile.id);
      break;
    }
    case "wq":
    case "x": {
      await utils.saveFile(editor.fileContentString.join("\n"), editor.$invokeTauriCommand);
      closeTabBarItem(editor.currentEditingFile.id);
      break;
    }
    default: {
      let cmdSplit = command.split(" ");
      let isNewFileCmd = cmdSplit.length > 1 && cmdSplit.length < 4 && cmdSplit.includes("newfile");
      let isNewDirCmd = cmdSplit.length > 1 && cmdSplit.length < 4 && cmdSplit.includes("newdir");

      let currentDir = store.state.currentDirectory;
      let projectRoot = store.state.projectRootPath;
      let sidebarItems = store.state.sidebarItems;
      let invalidCharacters = /[<>:"|?*]/;

      if (isNewFileCmd) {
        let fileName = cmdSplit[1];
        if (invalidCharacters.test(fileName)) return;

        let fullPath = `${store.state.currentDirectory}/${fileName}`;

        editor
          .$invokeTauriCommand("create_empty_file", {
            filePath: fullPath,
            fileName: fileName,
            layerLevel: editor.currentEditingFile.layerLevel,
          })
          .then((newItem: SidebarItem) => {
            if ((cmdSplit.length === 3 && cmdSplit[2] === ".") || currentDir === projectRoot) {
              store.commit("addNewSidebarItem", { item: newItem });
            }

            if (cmdSplit.length === 2) {
              let index = store.state.sidebarItems.findIndex(
                (item: SidebarItem) => item.fullPath === currentDir
              );
              let indexToInsert: number | null = null;

              for (let i = index + 1; i < sidebarItems.length; i++) {
                if (sidebarItems[i].isFile) {
                  indexToInsert = i;
                  break;
                }
              }
              if (indexToInsert) {
                store.commit("addNewSidebarItem", { item: newItem, index: indexToInsert });
              } else {
                store.commit("addNewSidebarItem", { item: newItem, index: index + 1 });
              }
            }
          })
          .catch(() => {});
      } else if (isNewDirCmd) {
        let dirName = cmdSplit[1];
        if (invalidCharacters.test(dirName)) return;

        let fullPath = `${store.state.currentDirectory}/${dirName}`;

        editor
          .$invokeTauriCommand("create_empty_dir", {
            dirPath: fullPath,
            dirName: dirName,
            layerLevel: editor.currentEditingFile.layerLevel,
          })
          .then((newItem: SidebarItem) => {
            store.commit("addNewSidebarItem", { item: newItem, index: 0 });
          })
          .catch(() => {});
      } else {
        helper.changeVimMode("commandErr");
        return;
      }
      break;
    }
  }
  helper.changeVimMode("normal", editor.cursor.properties, editor.cursor.renderer);
}

function handleVimCommands(key: string, editor: any) {
  let command = "";

  // prettier-ignore
  switch (key) {
    case "Escape": {
      helper.changeVimMode("normal", editor.cursor.properties, editor.cursor.renderer);
      break;
    }
    case "Backspace": {
      let oldCommand = store.state.vimCommand;
      command = oldCommand.slice(0, command.length - 1); 
      break;
    }
    case " ": {
      command = store.state.vimCommand + " ";
      break;
    }
    case "Enter": {
      executeVimCommand(store.state.vimCommand, editor);
      break;
    }
    default: {
      let isPrintableCharacter = key.length === 1;
      if (isPrintableCharacter) {
        command = store.state.vimCommand + key;
      }
      break;
    }
  }
  store.commit("updateVimCommand", command);
}

export default {
  handleVimCommands,
};
