import { tokenizePythonCode } from "./python";
import { tokenizeJavaScriptCode } from "./javascript";
import { tokenizeTypeScriptCode } from "./typescript";
import { tokenizeRustCode } from "./rust";
import { Token } from "../../../store/interfaces";
import store from "../../../store/index";
import helper from "../helper";

// prettier-ignore
export function tokenize(input: string): string | null {
    let lang = store.state.language;
    let tokens: Token[] | null;

    if (lang === "javascript") {
        tokens = tokenizeJavaScriptCode(input);
    }
    else if (lang === "typescript") {
        tokens = tokenizeTypeScriptCode(input);
    }
    else if (lang === "rust") {
        tokens = tokenizeRustCode(input);
    }
    else {
        tokens = tokenizePythonCode(input);
    }
    
    if (!tokens) return null;
    return helper.lineProcessing(tokens);
}
