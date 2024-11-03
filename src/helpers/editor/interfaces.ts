interface EditorMarginStyle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface EditorStyle {
  textColor: string;
  margin: EditorMarginStyle;
}

export interface Cursor {
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    backgroundColor: string;
    opacity: number;
  };
  row: number;
  column: number;
}

export interface Selection {
  start: { row: number; column: number };
  end: { row: number; column: number };
  direction: string;
  style: {
    backgroundColor: string;
    opacity: number;
  };
  position: { x: number; y: number };
}

export interface SuggestionPanelStyle {
  backgroundColor: string;
  textColor: string;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  opacity: number;
}

export interface SuggestionPanel {
  positionX: number;
  positionY: number;
}
