## BaCE - Basic Code Editor with basic vim key-bindings based on Webview

### Note: Linux & MacOS only

- Built with: Tauri v2, Vue 3, Pixi.js v8

https://github.com/user-attachments/assets/65e21c78-9f90-4a9e-8225-76d8e7c5b3c2

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
