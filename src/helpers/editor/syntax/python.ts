import store from "../../../store/index";
import { SyntaxHighlight, Token } from "../../../store/interfaces";

function createToken(color: string, value: string): Token {
  let token: Token = {
    value: value,
    color: color,
  };
  return token;
}

// prettier-ignore
let PYTHON_KEYWORDS: Array<string> = [
  "and", "as", "assert", "break", "class", "continue",
  "def", "del", "elif", "else", "except", "False",
  "finally", "for", "from", "global", "if", "import",
  "in", "is", "lambda", "None", "nonlocal", "not",
  "or", "pass", "raise", "return", "True", "try",
  "while", "with", "yield", "async", "await", "self",
  "match", "case"
];

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
  while (pos < inputChars.length && inputChars[pos] !== "\n") {
    pos++;
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

  // Check for triple-quoted string
  const isTripleQuote =
    pos + 1 < inputChars.length &&
    inputChars[pos] === startChar &&
    inputChars[pos + 1] === startChar;
  if (isTripleQuote) {
    pos += 2; // Move past triple quotes
    while (pos + 2 < inputChars.length) {
      if (
        inputChars[pos] === startChar &&
        inputChars[pos + 1] === startChar &&
        inputChars[pos + 2] === startChar
      ) {
        pos += 3; // End triple quotes
        break;
      }
      pos++;
    }
  } else {
    // Single-line string
    while (pos < inputChars.length && inputChars[pos] !== startChar) {
      if (inputChars[pos] === "\\" && pos + 1 < inputChars.length) {
        pos += 2;
        continue;
      }
      pos++;
    }
    pos++; // Move past closing quote
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

function handleReturnOperator(tokens: Token[], pos: number, color: string): number {
  tokens.push(createToken(color, "->"));
  return pos + 2;
}

function handleOperator(tokens: Token[], currentChar: string, pos: number, color: string): number {
  tokens.push(createToken(color, currentChar));
  return pos + 1;
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

  if (nextChar === "(" || inputChars[startPos - 1] === ".") {
    tokens.push(createToken(functionNameColor, value));
  } else {
    if (PYTHON_KEYWORDS.includes(value)) {
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

// prettier-ignore
export function tokenizePythonCode(input: string): Token[] | null {
  let tokens: Token[] = [];

  if (!syntaxHighlight || !langTokenTypes) {
    syntaxHighlight = store.state.settings.syntaxHighlight;
    if (!syntaxHighlight) return null;

    langTokenTypes = syntaxHighlight.languages.find((lang) => lang.language === "python");
    if (!langTokenTypes) return null;
  }
  let pos = 0;
  const inputChars = Array.from(input);

  while (pos < inputChars.length) {
    const currentChar = inputChars[pos];

    if (/\s/.test(currentChar)) {
      pos = handleWhitespace(tokens, inputChars, pos, langTokenTypes["whitespaceColor"]);
    } 
    else if (currentChar === "#") {
      pos = handleComment(tokens, inputChars, pos, langTokenTypes["commentColor"]);
    } 
    else if (currentChar === '"' || currentChar === "'") {
      pos = handleStringLiteral(tokens, inputChars, pos, langTokenTypes["stringLiteralColor"]);
    } 
    else if (/\d/.test(currentChar)) {
      pos = handleNumber(tokens, inputChars, pos, langTokenTypes["numberColor"]);
    } 
    else if (currentChar === "-" && inputChars[pos + 1] === ">") {
      pos = handleReturnOperator(tokens, pos, langTokenTypes["operatorColor"]);
    } 
    else if ("+-*/=%".includes(currentChar)) {
      pos = handleOperator(tokens, currentChar, pos, langTokenTypes["operatorColor"]);
    } 
    else if (/[a-zA-Z_]/.test(currentChar)) {
      pos = handleIdentifier(
        tokens,
        inputChars,
        pos,
        langTokenTypes["functionNameColor"],
        langTokenTypes["keywordColor"],
        langTokenTypes["classNameColor"],
        langTokenTypes["identifierColor"]
      );
    } 
    else if (",.:;()[]{}'\"".includes(currentChar)) {
      pos = handlePunctuation(tokens, currentChar, pos, langTokenTypes["punctuationColor"]);
    } 
    else {
      pos = handleUnknown(tokens, currentChar, pos, langTokenTypes["unknownColor"]);
    }
  }
  return tokens;
}
