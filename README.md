## BaCE - Basic Code Editor with basic vim key-bindings (Side project)
### Note: Linux & MacOS only

- Built with: Tauri v2, Vue 3, Pixi.js v8
- [Linux BaCE_0.1.0_amd64.deb build download link via google drive](https://drive.google.com/file/d/1O0sZCtRZm8c_VRgiU1bFRuHPe72SQE3u/view?usp=drive_link)
- [Linux BaCE_0.1.0_x86_64.rpm build download link via google drive](https://drive.google.com/file/d/19QlMPBzyHRtQkKZlhYFiosHjtgfWCy83/view?usp=drive_link)
- [MacOS BaCE_0.1.0_x64.dmg build download link via google drive](https://drive.google.com/file/d/1R6hHYeUqMmTZRhCv91T0Cv9Qj1w2UxRs/view?usp=drive_link)

### Clone the project
```
https://github.com/MuongKimhong/BaCE.git
```
To run this project `tauri-cli` is expected.
```
cargo install tauri-cli
```
**Install frontend dependencies**
```
npm install
```
**Install backend dependencies**
```
cd src-tauri
cargo build
cd ..
```
**Run the project**
```
cargo tauri dev
```
At first start, BaCE will try to create a `BaCE` folder inside `$HOME` directory to keep all related files. If it fails to create the folder inside `$HOME` directory the app will not run as expected.

#### Made with Love 💙
