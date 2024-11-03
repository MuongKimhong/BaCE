<template>
  <div class="sidebar-item">
    <span v-if="isDir && isFocus">
      <i class="fas fa-folder"></i>
    </span>
    <span v-else-if="isDir">
      <i class="far fa-folder"></i>
    </span>
    <span v-else>
      <i class="fas fa-file-code" style="padding-left: 3px"></i>
    </span>
    <span class="sidebar-item-text">{{ name }}</span>
  </div>
</template>

<script>
import "../../assets/styles/sidebar.css";
import helper from "../../helpers/sidebar/helper";

export default {
  name: "SidebarItem",
  props: {
    id: String,
    layerLevel: Number,
    name: String,
    isDir: Boolean,
    isFile: Boolean,
    fullPath: String,
    dirOpened: Boolean,
    fileContentChanged: Boolean,
  },
  watch: {
    isFocus(newVal) {
      this.checkIsFocus();
    },
  },
  computed: {
    isFocus() {
      for (let item of this.$store.state.sidebarItems) {
        if (item.id === this.id) return item.isFocus;
      }
    },
  },
  mounted() {
    this.checkIsFocus();
    this.setLayerLevelIdentation();
    this.$el.addEventListener("click", this.handleSidebarItemOnClick);
  },
  methods: {
    checkIsFocus: function () {
      if (this.isFocus) {
        this.$el.classList.add("sidebar-item-focused");
      } else {
        this.$el.classList.remove("sidebar-item-focused");
      }
    },

    setLayerLevelIdentation: function () {
      let paddingLeft = parseInt(window.getComputedStyle(this.$el).paddingLeft);
      this.$el.style.paddingLeft = `${this.layerLevel * paddingLeft * 2}px`;
    },

    handleSidebarItemOnClick: async function () {
      this.$store.commit("setSidebarItemToFocus", this.id);
      let sidebarItem = { ...this.$props, isFocus: true };

      if (this.isFile) {
        await helper.handleSidebarItemAsFileOnClick(this.$invokeTauriCommand, sidebarItem);
        this.$emit("itemClicked");
      } else {
        await helper.handleSidebarItemAsDirOnClick(this.$invokeTauriCommand, sidebarItem);
      }
    },
  },
};
</script>
