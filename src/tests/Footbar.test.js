import { mount } from "@vue/test-utils";
import Footbar from "../components/Footbar.vue";
import { createStore } from "vuex";

describe("Footbar.vue", () => {
  expect(Footbar).toBeTruthy();
  let store;

  beforeEach(() => {
    // Create a new Vuex store for each test
    store = createStore({
      state: {
        vimMode: "",
        vimCommand: "",
        vimCommandErr: "",
      },
    });
  });

  test("mount component and render command error", async () => {
    store.state.vimMode = "commandErr";
    const wrapper = mount(Footbar, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.find("#vim-mode").text()).toBe(":unknown command boss!");
  });

  test('renders current command when vimMode is "commands"', async () => {
    store.state.vimMode = "commands";
    store.state.vimCommand = "wq";
    const wrapper = mount(Footbar, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.find("#vim-mode").text()).toBe(":wq");
  });

  test('renders current mode when vimMode is not "commandErr" & "commands"', async () => {
    store.state.vimMode = "normal";
    const wrapper = mount(Footbar, {
      global: {
        plugins: [store],
      },
    });
    expect(wrapper.find("#vim-mode").text()).toBe("mode: --normal--");
  });
});
