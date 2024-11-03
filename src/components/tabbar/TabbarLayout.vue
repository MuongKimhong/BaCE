<template>
  <div id="tabbar-layout">
    <div v-for="(item, key) in tabbarItems" :key="key">
      <TabbarItem
        :id="item.id"
        :name="item.name"
        :fullPath="item.fullPath"
        :isFocus="item.isFocus"
        :isDir="item.isDir"
        :isFile="item.isFile"
        :layerLevel="item.layerLevel"
        :dirOpened="item.dirOpened"
        :fileContentChanged="item.fileContentChanged"
        :key="item.id"
      />
    </div>
  </div>
</template>

<script>
import "../../assets/styles/tabbar.css";
import TabbarItem from "./TabbarItem.vue";

export default {
  name: "TabbarLayout",
  components: {
    TabbarItem,
  },
  watch: {
    style(newValue) {
      if (newValue) {
        this.setTabBarStyle();
      }
    },
  },
  computed: {
    tabbarItems() {
      return this.$store.state.currentOpeningFiles;
    },
    style() {
      return this.$store.state.settings.tabBar;
    },
  },
  methods: {
    setTabBarStyle: function () {
      document.documentElement.style.setProperty("--tabbar-font-size", this.style.fontSize);
      document.documentElement.style.setProperty("--tabbar-text-color", this.style.color);
    },
  },
};
</script>
