<template>
  <div id="editor-container" ref="editorContainer">
    <WelcomeMessage v-if="showWelcomeMsg" />
    <div id="main" ref="mainContainer">
      <div id="line-number" ref="lineNumber">1</div>
      <div id="editor-area" ref="editorArea">
        <v-virtual-scroll :items="fileContentDOM" ref="scroller" height="100%" id="scroller">
          <template v-slot:default="{ item, index }">
            <div
              class="line-div"
              :id="`line-${index + 1}`"
              :ref="`line-${index + 1}`"
              v-html="item"
            ></div>
          </template>
        </v-virtual-scroll>
      </div>
      <Footbar ref="footbar" />
    </div>
  </div>
</template>

<script>
import Footbar from "./Footbar.vue";
import { Application } from "pixi.js";
import "../assets/styles/editor.css";
import WelcomeMessage from "./WelcomeMessage.vue";
import keydown from "../helpers/editor/keydown";
import keyup from "../helpers/editor/keyup";
import render from "../helpers/editor/render";
import helper from "../helpers/editor/helper";
import vimCommands from "../helpers/editor/vim/commands";

// prettier-ignore
export default {
  name: "Editor",
  components: { WelcomeMessage, Footbar },
  data() {
    return {
      editorCanvas: new Application(),
      canvasRect: null,
      showWelcomeMsg: true,

      ctrlSPressed: { ctrlPressed: false, sPressed: false },
      ctrlNumberPressed: { ctrlPressed: false, numberPressed: false},

      fileContentString: this.editingFileContentString,
      cursor: {
        properties: {
          size: { width: 0, height: 0 },
          position: { x: 0, y: 0 }, // position relative to canvas
          style: this.$store.state.vimModeCursorStyle.normal,
          row: 0, // current line
          column: 0, // current character in current line
          min: { x: 0, y: 0 }
        },
        renderer: null,
        initialized: false
      },
      editorRect: null,
      footbarRect: null,
      mainRect: null,

      editorMouseDownListenerAdded: false,

      // use to detect 2 key binding, like gg, dd, yy, etc....
      lastKey: null,
      timeout: null,
      isLineCopy: false,
      copiedText: "",

      isSyncingScroll: false,
      ticking: false,
    };
  },
  props: { isActive: Boolean },
  watch: {
    style(newValue) {
      let { fontSize, fontWeight } = newValue;
      helper.updateEditorAreaFontStyle(this.$refs["editorArea"], fontSize, fontWeight);
      helper.updateLineNumberAreaFontStyle(this.$refs["lineNumber"], fontSize, fontWeight);

      /*
      add empty line so that fileContentDOM watcher will trigger and init cursor renderer.
      require font size & font weight for cursor renderer initialization
      */
      if (!this.cursor.initialized) {
        helper.addItemFileContentDOM(0, `<span class="empty-line">A</span>`);
      }
      else {
        requestAnimationFrame(() => {
          render.destroyCursorRenderer(this);
          helper.adjustCursorAndCanvasLayout(this);
          render.initCursorRenderer(this);
          helper.changeVimMode("normal", this.cursor.properties, this.cursor.renderer);
        })
      }
    },
    fileContentDOM: {
      handler(newValue) {
        requestAnimationFrame(() => {
          if (!this.cursor.initialized) {
            render.destroyCursorRenderer(this);
            helper.adjustCursorAndCanvasLayout(this);
            render.initCursorRenderer(this);
            helper.changeVimMode("normal", this.cursor.properties, this.cursor.renderer);
            this.footbarRect = this.$refs["footbar"].$el.getBoundingClientRect();
          }
          this.mainRect = this.$refs["mainContainer"].getBoundingClientRect();
        });
      },
      deep: true
    },
    editingFileContentString(newValue) {
      this.fileContentString = newValue;
    },
    currentOpeningFiles: {
      handler(newValue) {
        if (newValue.length === 0) {
          this.showWelcomeMsg = true;
          helper.changeVimMode("normal", this.cursor.properties, this.cursor.renderer);
          this.cursor.initialized = false;
          if (this.isActive) this.$emit("switchActiveToSidebar");
        }
        else {
          this.showWelcomeMsg = false;
        }
      },
      deep: true,
    },
    currentEditingFile(newValue) {
      if (Object.keys(newValue).length == 0) {
        this.$store.commit("updateFileContentString", this.fileContentString);
      }
      render.resetCursor(this);
      helper.changeVimMode("normal", this.cursor.properties, this.cursor.renderer);
    },
  },
  computed: {
    fileContentDOM() { // array of line which represent as dom element
      return this.$store.state.fileContentDOM;
    },
    editingFileContentString() { // Array of line which represent as string
      return this.$store.state.fileContentString;
    },
    currentOpeningFiles() {
      return this.$store.state.currentOpeningFiles;
    },
    currentEditingFile() {
      return this.$store.state.currentEditingFile;
    },
    style() {
      return this.$store.state.settings.editor;
    },
    vimMode() {
      return this.$store.state.vimMode;
    },
  },
  async mounted() {
    await this.createPixiApplication();

    this.$refs["scroller"].$el.addEventListener("scroll", () => this.handleEditorAreaScroll(
      this.$refs["scroller"].$el,
      this.$refs["lineNumber"]
    ));
    this.$refs["scroller"].$el.addEventListener("wheel", (e) => {
      e.preventDefault();
    })
  },
  methods: {
    createPixiApplication: async function () {
      await this.editorCanvas.init({
        resizeTo: this.$refs["editorArea"],
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundAlpha: 0,
        eventMode: 'none'
      });
      this.editorCanvas.stage.interactiveChildren = false;
      this.editorCanvas.canvas.classList.add("editor-canvas");
      this.$refs["mainContainer"].appendChild(this.editorCanvas.canvas);
    },

    handleEditorKeyDownEvent: function (event) {
      if (event.ctrlKey) {
        keydown.handleCtrlKeyPressed(this, event);
        return;
      }

      switch (this.vimMode) {
        case "normal": {
          keydown.handleNormalCase(this, event);
          break;
        }
        case "commands": {
          vimCommands.handleVimCommands(event.key, this);
          break;
        }
        case "commandErr": {
          keydown.handleCommandErrCase(event.key, this.cursor);
          break;
        }
        case "insert": {
          keydown.handleInsertCase(this, event);
          helper.updateFileContentCaches(this);
          helper.updateFileContentChanged(true, this.currentEditingFile.id);
          break;
        }
      }
      return;
    },

    handleEditorKeyUpEvent: function (event) {
      if (this.isActive) {
        if (this.ctrlSPressed.ctrlPressed || this.ctrlSPressed.sPressed) {
          keyup.handleResetCtrlSPressed(event.key, this.ctrlSPressed);
        }
        else if (this.ctrlNumberPressed.ctrlPressed || this.ctrlNumberPressed.numberPressed) {
          keyup.handleResetCtrlNumberPressed(event.key, this.ctrlNumberPressed);
        }
      }
    },

    syncScrollEditorAreaAndLineNumber(sourceDiv, targetDiv) {
      if (!this.isSyncingScroll) {
        this.isSyncingScroll = true;
        targetDiv.scrollTop = sourceDiv.scrollTop;
        this.isSyncingScroll = false;
      }
    },

    handleEditorAreaScroll(sourceDiv, targetDiv) {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.syncScrollEditorAreaAndLineNumber(sourceDiv, targetDiv);
          this.ticking = false;
        });
        this.ticking = true;
      }
    },
  },
};
</script>
