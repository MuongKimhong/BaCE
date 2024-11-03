<template>
  <div class="app-container" ref="appContainer">
    <MenuLayout @switchActiveToEditor="handleSwitchActiveToEditor" />
    <div v-if="canMountChildComponents" class="main-container">
      <SidebarLayout
        :isActive="sidebarActive"
        @switchActiveToEditor="handleSwitchActiveToEditor"
        ref="sidebar"
      />
      <div class="right">
        <TabbarLayout ref="tabbar" />
        <Editor
          :isActive="editorActive"
          @switchActiveToSidebar="handleSwitchActiveToSidebar"
          ref="editor"
        />
      </div>
    </div>
  </div>
</template>

<script>
import helper from "./helpers/app";
import "./assets/styles/app.css";
import Editor from "./components/Editor.vue";
import Footbar from "./components/Footbar.vue";
import MenuLayout from "./components/menu/MenuLayout.vue";
import TabbarLayout from "./components/tabbar/TabbarLayout.vue";
import SidebarLayout from "./components/sidebar/SidebarLayout.vue";
import { Application } from "pixi.js";

// prettier-ignore
export default {
  name: "App",
  components: {
    MenuLayout,
    TabbarLayout,
    SidebarLayout,
    Footbar,
    Editor,
  },

  data() {
    return {
      sidebarActive: true,
      editorActive: false,
      canvas: new Application(),
      canMountChildComponents: false,
      defaultBgColor: "#212121",

      // app errors when startup
      hasAppErr: false,
      appErrs: [],

      bgImageSprite: null,
      resizeListenerAdded: false,
    };
  },

  watch: {
    settings: {
      async handler(config) {
        if (config) {
          if (config.bgType === "image") {
            await helper.setBackgroundImage(this, config.bgImageBase64);
          } 
          else {
            helper.setBackgroundColor(this, config.bgColor);
          }
        }
      },
      deep: true,
    },
  },

  computed: {
    settings() {
      return this.$store.state.settings;
    },
  },

  created() {
    this.createPixi();
    this.$listenTauriEvent("bg-image-change", async (event) => {
      await helper.handleBgImageChange(this, event);
    });
    this.$listenTauriEvent("bg-type-change-image-to-color", (event) => {
      helper.handleBgTypeChangeImageToColor(this, event);
    });
    this.$listenTauriEvent("internal_error", async (event) => {
      await this.$dialogMessage(event.payload, { title: "BaCE", kind: "error" });
    });
  },

  async mounted() {
    await helper.checkAppStartupErrs(this);

    if (!this.hasAppErr) {
      helper.readSettingsConfig(this);
      window.addEventListener("keydown", this.handleKeyDownEvent);
      window.addEventListener("keyup", this.handleKeyUpEvent);
    }
  },

  methods: {
    handleSwitchActiveToEditor: function () {
      this.sidebarActive = false;
      this.editorActive = true;
    },

    handleSwitchActiveToSidebar: function () {
      this.sidebarActive = true;
      this.editorActive = false;
    },

    handleKeyDownEvent: function (event) {
      event.preventDefault();

      if (this.sidebarActive) {
        this.$refs["sidebar"].handleSidebarKeyDownEvent(event);
      } 
      else {
        this.$refs["editor"].handleEditorKeyDownEvent(event);
      }
    },

    handleKeyUpEvent: function (event) {
      if (this.editorActive) {
        event.preventDefault();
        this.$refs["editor"].handleEditorKeyUpEvent(event);
      }
    },

    createPixi: async function () {
      await this.canvas.init({
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
      });
      this.canvas.canvas.id = "background-canvas";
      this.canvas.canvas.classList.add("background");
      document.body.appendChild(this.canvas.canvas);
    },
  },
};
</script>
