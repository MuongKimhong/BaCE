function handleResetCtrlSPressed(keyReleased: string, ctrlSPressedObject: any) {
  if (keyReleased === "s") ctrlSPressedObject.sPressed = false;
  if (keyReleased === "Control") ctrlSPressedObject.ctrlPressed = false;
}

function handleResetCtrlNumberPressed(keyReleased: string, ctrlNumberPressedObject: any) {
  if (keyReleased >= "1" && keyReleased <= "9") {
    ctrlNumberPressedObject.numberPressed = false;
  }
  if (keyReleased === "Control") ctrlNumberPressedObject.ctrlPressed = false;
}

export default {
  handleResetCtrlNumberPressed,
  handleResetCtrlSPressed,
};
