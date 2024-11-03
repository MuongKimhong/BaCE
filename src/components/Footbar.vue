<template>
  <div id="footbar">
    <h4
      v-if="vimMode === 'commandErr'"
      id="vim-mode"
      variant="text"
      class="text-lowercase footbar-text"
      size="small"
      style="color: #f7ff00"
    >
      :unknown command boss!
    </h4>
    <h4
      v-else-if="vimMode === 'commands'"
      id="vim-mode"
      variant="text"
      class="text-lowercase footbar-text"
      size="small"
    >
      :{{ vimCommand }}
    </h4>
    <h4 v-else id="vim-mode" variant="text" class="text-uppercase footbar-text" size="small">
      mode: --{{ vimMode }}--
    </h4>
  </div>
</template>

<script>
import "../assets/styles/footbar.css";
export default {
  name: "Footbar",
  watch: {},
  computed: {
    vimMode() {
      return this.$store.state.vimMode;
    },
    vimCommand() {
      return this.$store.state.vimCommand;
    },
    vimCommandErr() {
      return this.$store.state.vimCommandErr;
    },
  },
};
</script>
