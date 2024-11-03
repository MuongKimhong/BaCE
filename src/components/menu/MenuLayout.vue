<template>
  <div id="menu-layout">
    <MenuItemFile @fileOpened="handleFileOpened" />
  </div>
</template>

<script>
import "../../assets/styles/menu.css";
import MenuItemFile from "./MenuItemFile.vue";

export default {
  name: "MenuLayout",
  components: {
    MenuItemFile,
  },
  methods: {
    handleFileOpened: function () {
      this.$emit("switchActiveToEditor");
    },
  },
};
</script>
