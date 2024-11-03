<template>
  <div class="menu-item text-center">
    <v-btn
      id="file-btn"
      density="compact"
      variant="text"
      class="text-capitalize"
      @click="fileBtnOnClick"
    >
      File
    </v-btn>

    <div v-if="showDialog" id="file-btn-dialog" ref="fileDialog">
      <!-- <div class="file-btn-dialog-item" @click="showNewFileDialog = true">New File</div> -->
      <div class="file-btn-dialog-item" @click="openFileOnClick">Open File</div>
      <div class="file-btn-dialog-item" @click="openFolderOnClick">Open Folder</div>
      <div class="file-btn-dialog-item" @click="settingsOnClick">Settings</div>
      <div class="file-btn-dialog-item" @click="exitBtnOnClick">Exit</div>
    </div>

    <NewFileDialog v-model="showNewFileDialog" @newFileCreated="handleNewFileCreated" />
  </div>
</template>

<script>
import "../../assets/styles/menu.css";
import NewFileDialog from "./NewFileDialog.vue";
import utils from "../../helpers/utils";

import { open } from "@tauri-apps/plugin-dialog";

export default {
  name: "MenuItemFile",
  components: {
    NewFileDialog,
  },
  data() {
    return {
      showDialog: false,
      showNewFileDialog: false,
    };
  },
  computed: {
    currentEditingFile() {
      return this.$store.state.currentEditingFile;
    },
  },
  mounted() {},
  methods: {
    fileBtnOnClick: function (event) {
      this.showDialog = !this.showDialog;
      event.stopPropagation();

      if (this.showDialog) document.addEventListener("click", this.handleClickOutside);
      else document.removeEventListener("click", this.handleClickOutside);
    },
    handleClickOutside: function (event) {
      if (this.$refs.fileDialog && !this.$refs.fileDialog.contains(event.target)) {
        this.showDialog = false;
        document.removeEventListener("click", this.handleClickOutside);
      }
    },
    openFileToEdit: function (filePath) {
      let fileItem = {
        id: utils.getRandomString(5),
        layerLevel: 1,
        name: filePath.split("/").pop(),
        isDir: false,
        isFile: true,
        isFocus: true,
        fullPath: filePath,
        dirOpened: false,
        fileContentChanged: false,
      };
      this.$store.commit("setCurrentOpeningFilesFromSidebar", fileItem);
      this.$store.commit("setCurrentEditingFile", fileItem);
    },
    openFileOnClick: async function () {
      let filePath = await open({
        directory: false,
        multiple: false,
        title: "Select a file",
      });

      if (filePath) {
        try {
          await utils.readFileContent(this.$invokeTauriCommand, filePath);
          this.openFileToEdit(filePath);
          this.$emit("fileOpened");
          this.showDialog = false;
        } catch (_) {
          return;
        }
      }
    },
    openFolderOnClick: async function () {
      let folderPath = await open({
        directory: true,
        multiple: false,
        title: "Select a folder to open in PVT",
      });
      if (folderPath) {
        await utils.readFolderContent(this.$invokeTauriCommand, folderPath, true, 1);
        this.showDialog = false;
      }
    },
    exitBtnOnClick: async function () {
      await this.$invokeTauriCommand("exit_app");
    },
    handleNewFileCreated: async function (filePath) {
      await utils.readFileContent(this.$invokeTauriCommand, filePath);
      this.openFileToEdit(filePath);
      this.$emit("fileOpened");
      this.showDialog = false;
    },
    settingsOnClick: async function () {
      let filePath = await this.$invokeTauriCommand("get_settings_file_path_cmd");
      await utils.readFileContent(this.$invokeTauriCommand, filePath);
      this.$store.commit("setSettingsPath", filePath);
      this.openFileToEdit(filePath);
      this.$emit("fileOpened");
      this.showDialog = false;
    },
  },
};
</script>
