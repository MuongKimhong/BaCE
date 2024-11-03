import { Sprite, Assets, Color } from "pixi.js";
import store from "../store/index";

function setBackgroundColor(app: any, bgColor: string): void {
  let color: Color;
  try {
    color = new Color(bgColor);
  } catch (_) {
    color = new Color(this.defaultBgColor);
  }
  app.canvas.renderer.background.color = color;
}

async function setBackgroundImage(app: any, bgBase64: string): Promise<void> {
  let texture = await Assets.load(bgBase64);

  app.bgImageSprite = new Sprite(texture);
  app.bgImageSprite.width = window.innerWidth;
  app.bgImageSprite.height = window.innerHeight;
  app.canvas.stage.addChild(app.bgImageSprite);

  if (!app.resizeListenerAdded) {
    window.addEventListener("resize", () => {
      app.bgImageSprite.width = window.innerWidth;
      app.bgImageSprite.height = window.innerHeight;
    });
    app.resizeListenerAdded = true;
  }
}

async function handleBgImageChange(app: any, event: any): Promise<void> {
  if (app.bgImageSprite) {
    app.canvas.stage.removeChild(app.bgImageSprite);
    await setBackgroundImage(app, event.payload);
  }
}

function handleBgTypeChangeImageToColor(app: any, event: any): void {
  if (app.bgImageSprite) {
    app.canvas.stage.removeChild(app.bgImageSprite);
    setBackgroundColor(app, event.payload);
  }
}

async function readSettingsConfig(app: any): Promise<void> {
  let res = await app.$invokeTauriCommand("read_setting_configs");
  store.commit("setSettings", res);
}

function createAppStartupErrsMsg(appErrs: Array<string>): string {
  let errMsg = "one or more errors occur during app initialization.";

  for (let err of appErrs) {
    errMsg += `\n * ${err}`;
  }
  return errMsg;
}

async function checkAppStartupErrs(app: any): Promise<void> {
  app.appErrs = await app.$invokeTauriCommand("check_app_startup_errs");
  app.hasAppErr = app.appErrs.length > 0;
  app.canMountChildComponents = !app.hasAppErr;

  if (app.hasAppErr) {
    let errMsg = createAppStartupErrsMsg(app.appErrs);

    let result = await app.$dialogMessage(errMsg, {
      title: "BaCE",
      kind: "error",
    });

    if (result === false || result === undefined) {
      await app.$invokeTauriCommand("exit_app");
    }
  }
}

// function testBgVideo(app: any): void {
//   let videoElement = document.createElement("video");
//   videoElement.loop = true;

//   videoElement.addEventListener("playing", (e) => {
//     console.log(e);
//   });

//   videoElement.addEventListener("canplay", () => {
//     const source = new VideoSource({
//       alphaMode: "no-premultiply-alpha",
//       updateFPS: 0,
//       loop: true,
//       preload: true,
//       autoPlay: true,
//       crossorigin: "anonymous",
//       resource: videoElement,
//     });
//     Ticker.shared.add(() => {
//       source.updateFrame();
//     });

//     const texture = new Texture.from(source);

//     let sprite = new Sprite(texture);
//     sprite.width = window.innerWidth;
//     sprite.height = window.innerHeight;
//     this.canvas.stage.addChild(sprite);
//   });

//   videoElement.src = "../test.mp4";
// }

export default {
  setBackgroundColor,
  setBackgroundImage,
  handleBgImageChange,
  handleBgTypeChangeImageToColor,
  readSettingsConfig,
  checkAppStartupErrs,
};
