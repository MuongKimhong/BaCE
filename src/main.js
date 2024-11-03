import { createApp } from "vue";
import "./style.css";

// vuetify
import "@fortawesome/fontawesome-free/css/all.css";
import "vuetify/styles";
import { createVuetify } from "vuetify";
import { aliases, fa } from "vuetify/iconsets/fa";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import store from "./store/index";

import App from "./App.vue";

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "fa",
    aliases,
    sets: {
      fa,
    },
  },
});

// const { writeTextFile } = window.__TAURI_PLUGIN_FS__;
const { listen } = window.__TAURI__.event;
const { emit } = window.__TAURI__.event;
const { message, ask } = window.__TAURI__.dialog;

const app = createApp(App);
app.config.globalProperties.$invokeTauriCommand = window.__TAURI__.core.invoke;
app.config.globalProperties.$listenTauriEvent = listen;
app.config.globalProperties.$emitTauriEvent = emit;
app.config.globalProperties.$dialogMessage = message;
app.config.globalProperties.$dialogAsk = ask;

app.use(store);
app.use(vuetify);
app.mount("#app");
