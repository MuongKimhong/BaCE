export interface SidebarItem {
  id: string;
  layerLevel: number;
  name: string;
  isDir: boolean;
  isFile: boolean;
  isFocus: boolean;
  fullPath: string;
  dirOpened: boolean;
  fileContentChanged: boolean;
}

export interface LanguageSyntaxHighlight {
  language: string;
  keywordColor: string;
  identifierColor: string;
  numberColor: string;
  operatorColor: string;
  punctuationColor: string;
  stringLiteralColor: string;
  whitespaceColor: string;
  unknownColor: string;
  commentColor: string;
  classNameColor: string;
  functionNameColor: string;
}

export interface SyntaxHighlight {
  languages: Array<LanguageSyntaxHighlight>;
}

export interface SidebarSetting {
  fontSize: string;
  color: string;
  width: string;
  widthAdjustable: boolean;
}

interface TabBarSetting {
  fontSize: string;
  color: string;
}

interface EditorSetting {
  fontSize: string;
  fontWeight: string;
}

export interface Settings {
  bgType: string; // image, color, default: color
  bgColor: string; // color name: default #212121
  bgImagePath: string;
  bgImageBase64: string;
  fontFamily: string;
  sideBar: SidebarSetting;
  tabBar: TabBarSetting;
  editor: EditorSetting;
  syntaxHighlight: SyntaxHighlight;
}

export interface Token {
  value: string;
  color: string;
}

export interface LineContent {
  tokens: Array<Token>;
}

export interface State {
  currentOpeningFiles: Array<SidebarItem>;
  currentEditingFile: SidebarItem;
  currentDirectory: string;
  sidebarItems: Array<SidebarItem>;
  settings: Settings;
  settingsPath: string;
  projectName: string;
  projectRootPath: string;
  hasFolderOpened: boolean;
  fileContentDOM: Array<string>;
  fileContentString: Array<string>;
  totalLines: number;
  language: string;
  vimMode: string;
  vimModeCursorStyle: {};
  vimCommand: string;
  vimCommandErr: boolean;
}
