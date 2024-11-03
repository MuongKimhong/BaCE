<template>
  <div
    :id="`tabbar-item-${id}`"
    :class="{ 'tabbar-item-focused': isFocus }"
    @click="tabBarItemOnClick()"
    @mouseover="handleMouseOver"
    @mouseleave="showHoverText = false"
    @mousemove="handleMouseMove"
  >
    <span v-show="showHoverText" class="hover-text" ref="hoverText">{{ fullPath }}</span>
    <button class="tabbar-btn" :class="{ 'tabbar-text-color-changed': fileContentChanged }">
      {{ name }}
      <span :id="`close-btn-${id}`" class="x-btn" @click="closeBtnOnClick($event)">x</span>
    </button>
  </div>
</template>

<script>
import "../../assets/styles/tabbar.css";
import utils from "../../helpers/utils";
import helper from "../../helpers/tabbar";

// prettier-ignore
export default {
  name: "TabbarItem",
  props: {
    id: String,
    name: String,
    fullPath: String,
    isFocus: Boolean,
    isDir: Boolean,
    isFile: Boolean,
    dirOpened: Boolean,
    layerLevel: Number,
    fileContentChanged: Boolean,
  },
  data() {
    return {
      showHoverText: false,
    };
  },
  methods: {
    tabBarItemOnClick: function () {
      utils.readFileContent(this.$invokeTauriCommand, this.fullPath);
      this.$store.commit("tabBarItemOnClickStateChange", this.$props);
    },

    closeBtnOnClick: async function (event) {
      event.stopPropagation();

      if (this.fileContentChanged) {
        this.tabBarItemOnClick();
        helper.showCloseTabConfirmDialog(this);
      } 
      else {
        helper.closeTabItem(this);
      }
    },

    moveFocusToNearByFile: function () {
      let nearByFile = helper.findNearByFile(this);

      if (nearByFile) {
        utils.readFileContent(this.$invokeTauriCommand, nearByFile.fullPath);
        this.$store.commit("tabBarItemOnClickStateChange", nearByFile)
      }
    },

    handleMouseOver: function (event) {
      helper.setHoverTextPosition(event.clientX, event.clientY, this);
      this.showHoverText = true;
    },

    handleMouseMove: function (event) {
      helper.setHoverTextPosition(event.clientX, event.clientY, this);
    },
  },
};
</script>
