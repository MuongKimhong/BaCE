<template>
  <div id="sidebar-layout" class="show-border-top" tabindex="0">
    <div v-if="hasFolderOpened">
      <h4 class="text-center mt-4">
        <i v-if="isActive" style="color: #78ff00">{{ projectName }}</i>
        <span v-else> {{ projectName }} </span>
      </h4>
      <div id="sidebar-item-list">
        <div v-for="item in sidebarItems" :key="item.id">
          <SidebarItem
            :id="item.id"
            :layerLevel="item.layerLevel"
            :name="item.name"
            :isDir="item.isDir"
            :isFile="item.isFile"
            :isFocus="item.isFocus"
            :fullPath="item.fullPath"
            :dirOpened="item.dirOpened"
            :fileContentChanged="item.fileContentChanged"
            :ref="`sidebarItem-${item.id}`"
            @itemClicked="handleItemClicked"
          />
        </div>
      </div>
    </div>
    <div v-else>
      <div class="text-center mt-4">
        <span>No folder opened</span>
      </div>
      <div class="text-center mt-5 px-0">
        <v-btn
          class="text-capitalize"
          density="comfortable"
          color="#263238"
          width="80%"
          @click="openFolderBtnOnClick"
        >
          Open Folder
        </v-btn>
        <div class="text-center mt-4">
          <span>or</span>
        </div>
        <div class="text-center mt-4">
          <span>Press <strong>Ctrl + f</strong> </span>
        </div>
      </div>
      <div class="text-center mt-10">
        <span>Made with Love <i class="fas fa-heart"></i></span>
      </div>
    </div>
  </div>
</template>

<script>
import "../../assets/styles/sidebar.css";
import SidebarItem from "./SidebarItem.vue";
import utils from "../../helpers/utils";
import { open } from "@tauri-apps/plugin-dialog";

// prettier-ignore
export default {
  name: "SidebarLayout",
  components: { SidebarItem },
  props: { isActive: Boolean },
  data() {
    return {
      focusedItemIndex: 0,
      addingItem: false,
      editingItemName: false,
      moveUpKeys: ["ArrowUp", "k"],
      moveDownKeys: ["ArrowDown", "j"],
    };
  },
  watch: {
    style: {
      handler(newValue) {
        this.setSidebarStyle();
      },
      deep: true,
    },
    focusedItemIndex(newValue) {
      this.$store.commit("setSidebarItemToFocus", this.sidebarItems[this.focusedItemIndex].id);
    },
    isActive(newValue) {
      if (newValue) {
        this.$el.style.borderRight = "2px solid #424242";
      } else {
        this.$el.style.borderRight = "1px solid #323232";
      }
    },
  },
  computed: {
    sidebarItems() {
      return this.$store.state.sidebarItems;
    },
    style() {
      return this.$store.state.settings.sideBar;
    },
    projectName() {
      return this.$store.state.projectName;
    },
    hasFolderOpened() {
      return this.$store.state.hasFolderOpened;
    },
  },
  mounted() {},
  methods: {
    handleSidebarKeyDownEvent: function (event) {
      if (this.hasFolderOpened) {
        let key = event.key;

        if (this.addingItem || this.editingItemName) return;

        if (this.moveUpKeys.includes(key)) {
          if (this.focusedItemIndex > 0) this.focusedItemIndex--;
        }
        else if (this.moveDownKeys.includes(key)) {
          if (this.focusedItemIndex < this.sidebarItems.length - 1) this.focusedItemIndex++;
        }
        else if (key == "Enter") {
          let itemId = this.sidebarItems[this.focusedItemIndex].id;
          this.$refs[`sidebarItem-${itemId}`][0].$el.click();
        }
        else if (key == "+") {
          this.style.width = `${parseInt(this.style.width, 10) + 5}px`;
          document.documentElement.style.setProperty("--sidebar-width", this.style.width);
        }
        else if (key == "-") {
          this.style.width = `${parseInt(this.style.width, 10) - 5}px`;
          document.documentElement.style.setProperty("--sidebar-width", this.style.width);
        }
        else if (event.ctrlKey && event.key === "Tab") {
          if (this.isActive) this.$emit("switchActiveToEditor");
        }
      }

      else {
        if (event.ctrlKey && event.key === "f") {
          this.openFolderBtnOnClick();
        }
      }
    },
    setSidebarStyle: function () {
      document.documentElement.style.setProperty("--sidebar-width", this.style.width);
      document.documentElement.style.setProperty("--sidebar-font-size", this.style.fontSize);
      document.documentElement.style.setProperty("--sidebar-text-color", this.style.color);
    },
    openFolderBtnOnClick: async function () {
      let folderPath = await open({
        directory: true,
        multiple: false,
        title: "Select a folder to open in PVT",
      });
      if (folderPath) {
        try {
          await utils.readFolderContent(this.$invokeTauriCommand, folderPath, true, 1);
        } catch (_) {
          return;
        }
      }
    },
    handleItemClicked: function () {
      this.$emit("switchActiveToEditor");
    },
  },
};
</script>
