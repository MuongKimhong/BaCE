import store from "../../../store/index";
import { SyntaxHighlight, Token } from "../../../store/interfaces";

// Token types and keywords for JavaScript
const JAVASCRIPT_KEYWORDS: string[] = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "await",
  "async",
];

function createToken(color: string, value: string): Token {
  return { color, value };
}

let syntaxHighlight: SyntaxHighlight | null = null;
let langTokenTypes: any | null = null;

function handleWhitespace(
  tokens: Token[],
  inputChars: string[],
  pos: number,
  color: string
): number {
  const startPos = pos;
  while (pos < inputChars.length && /\s/.test(inputChars[pos])) {
    pos++;
  }
  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleComment(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  const startPos = pos;
  pos++; // Move past the initial '/'

  if (inputChars[pos] === "/") {
    // Single-line comment
    while (pos < inputChars.length && inputChars[pos] !== "\n") {
      pos++;
    }
  } else if (inputChars[pos] === "*") {
    // Multi-line comment
    pos++;
    while (pos + 1 < inputChars.length) {
      if (inputChars[pos] === "*" && inputChars[pos + 1] === "/") {
        pos += 2;
        break;
      }
      pos++;
    }
  }

  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleStringLiteral(
  tokens: Token[],
  inputChars: string[],
  pos: number,
  color: string
): number {
  const startChar = inputChars[pos];
  const startPos = pos;
  pos++; // Move past the opening quote

  if (startChar === "`") {
    // Template literal
    while (pos < inputChars.length) {
      if (inputChars[pos] === "`") {
        pos++;
        break;
      }
      if (inputChars[pos] === "\\" && pos + 1 < inputChars.length) {
        pos += 2;
        continue;
      }
      pos++;
    }
  } else {
    // Single or double-quoted strings
    while (pos < inputChars.length && inputChars[pos] !== startChar) {
      if (inputChars[pos] === "\\" && pos + 1 < inputChars.length) {
        pos += 2;
        continue;
      }
      pos++;
    }
    pos++;
  }

  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleNumber(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  const startPos = pos;
  while (pos < inputChars.length && /\d/.test(inputChars[pos])) {
    pos++;
  }
  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleOperator(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  let value = inputChars[pos];
  pos++;

  if (pos < inputChars.length) {
    const nextChar = inputChars[pos];
    if (value === "=" && (nextChar === "=" || nextChar === ">")) {
      value += nextChar;
      pos++;
      if (nextChar === "=" && pos < inputChars.length && inputChars[pos] === "=") {
        value += "=";
        pos++;
      }
    } else if (value === "!" && nextChar === "=") {
      value += nextChar;
      pos++;
    }
  }

  tokens.push(createToken(color, value));
  return pos;
}

function handleIdentifier(
  tokens: Token[],
  inputChars: string[],
  pos: number,
  functionNameColor: string,
  keywordColor: string,
  classNameColor: string,
  identifierColor: string
): number {
  const startPos = pos;
  while (pos < inputChars.length && (/\w/.test(inputChars[pos]) || inputChars[pos] === "_")) {
    pos++;
  }
  const value = inputChars.slice(startPos, pos).join("");
  const nextChar = inputChars[pos] || " ";

  if (nextChar === "(") {
    tokens.push(createToken(functionNameColor, value));
  } else {
    if (JAVASCRIPT_KEYWORDS.includes(value)) {
      tokens.push(createToken(keywordColor, value));
    } else if (value[0] === value[0].toUpperCase()) {
      tokens.push(createToken(classNameColor, value));
    } else {
      tokens.push(createToken(identifierColor, value));
    }
  }

  return pos;
}

function handlePunctuation(
  tokens: Token[],
  currentChar: string,
  pos: number,
  color: string
): number {
  tokens.push(createToken(color, currentChar));
  return pos + 1;
}

function handleUnknown(tokens: Token[], currentChar: string, pos: number, color: string): number {
  tokens.push(createToken(color, currentChar));
  return pos + 1;
}

export function tokenizeJavaScriptCode(input: string): Token[] | null {
  const tokens: Token[] = [];

  if (!syntaxHighlight || !langTokenTypes) {
    syntaxHighlight = store.state.settings.syntaxHighlight;
    if (!syntaxHighlight) return null;

    langTokenTypes = syntaxHighlight.languages.find((lang) => lang.language === "javascript");
    if (!langTokenTypes) return null;
  }

  let pos = 0;
  const inputChars = Array.from(input);

  while (pos < inputChars.length) {
    const currentChar = inputChars[pos];

    if (/\s/.test(currentChar)) {
      pos = handleWhitespace(tokens, inputChars, pos, langTokenTypes.whitespaceColor);
    } else if (
      currentChar === "/" &&
      (inputChars[pos + 1] === "/" || inputChars[pos + 1] === "*")
    ) {
      pos = handleComment(tokens, inputChars, pos, langTokenTypes.commentColor);
    } else if (currentChar === '"' || currentChar === "'" || currentChar === "`") {
      pos = handleStringLiteral(tokens, inputChars, pos, langTokenTypes.stringLiteralColor);
    } else if (/\d/.test(currentChar)) {
      pos = handleNumber(tokens, inputChars, pos, langTokenTypes.numberColor);
    } else if ("+-*/%=><!".includes(currentChar)) {
      pos = handleOperator(tokens, inputChars, pos, langTokenTypes.operatorColor);
    } else if (/[a-zA-Z_]/.test(currentChar)) {
      pos = handleIdentifier(
        tokens,
        inputChars,
        pos,
        langTokenTypes.functionNameColor,
        langTokenTypes.keywordColor,
        langTokenTypes.classNameColor,
        langTokenTypes.identifierColor
      );
    } else if (",.:;()[]{}".includes(currentChar)) {
      pos = handlePunctuation(tokens, currentChar, pos, langTokenTypes.punctuationColor);
    } else {
      pos = handleUnknown(tokens, currentChar, pos, langTokenTypes.unknownColor);
    }
  }

  return tokens;
}
