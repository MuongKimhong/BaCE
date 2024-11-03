import store from "../../../store/index";
import { SyntaxHighlight, Token } from "../../../store/interfaces";

// Define Rust keywords
const RUST_KEYWORDS: string[] = [
  "as",
  "break",
  "const",
  "continue",
  "crate",
  "else",
  "enum",
  "extern",
  "false",
  "fn",
  "for",
  "if",
  "impl",
  "in",
  "let",
  "loop",
  "match",
  "mod",
  "move",
  "mut",
  "pub",
  "ref",
  "return",
  "self",
  "Self",
  "static",
  "struct",
  "super",
  "trait",
  "true",
  "type",
  "unsafe",
  "use",
  "where",
  "while",
  "async",
  "await",
  "dyn",
  "abstract",
  "final",
  "override",
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

function handleMacro(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  const startPos = pos;
  while (pos < inputChars.length && /[a-zA-Z0-9_]/.test(inputChars[pos])) {
    pos++;
  }
  if (inputChars[pos] === "!") {
    pos++; // Include the '!' in the macro name
    const value = inputChars.slice(startPos, pos).join("");
    tokens.push(createToken(color, value));
  }
  return pos;
}

function handleLifetime(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  const startPos = pos;
  pos++; // Move past the apostrophe
  while (pos < inputChars.length && /[a-zA-Z0-9]/.test(inputChars[pos])) {
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

  if (startChar === "r") {
    // Handle raw strings in Rust
    let hashCount = 0;
    while (inputChars[pos] === "#") {
      hashCount++;
      pos++;
    }

    if (inputChars[pos] === `"`) {
      pos++; // Move past opening quote
      const closingSequence = `"` + "#".repeat(hashCount);

      // Find the closing raw string sequence
      while (pos + hashCount < inputChars.length) {
        if (inputChars.slice(pos, pos + closingSequence.length).join("") === closingSequence) {
          pos += closingSequence.length;
          break;
        }
        pos++;
      }
    }
  } else if (startChar === "'") {
    // Handle single-character literals
    while (pos < inputChars.length && inputChars[pos] !== "'") {
      if (inputChars[pos] === "\\" && pos + 1 < inputChars.length) pos += 2;
      else pos++;
    }
    pos++;
  } else {
    // Handle double-quoted strings
    while (pos < inputChars.length && inputChars[pos] !== '"') {
      if (inputChars[pos] === "\\" && pos + 1 < inputChars.length) pos += 2;
      else pos++;
    }
    pos++;
  }

  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleAttribute(
  tokens: Token[],
  inputChars: string[],
  pos: number,
  color: string
): number {
  const startPos = pos;
  pos++; // Move past `#`

  if (inputChars[pos] === "[") {
    pos++;
    while (pos < inputChars.length && inputChars[pos] !== "]") pos++;
    pos++;
  }

  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleComment(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  const startPos = pos;
  while (pos < inputChars.length && inputChars[pos] !== "\n") pos++;
  const value = inputChars.slice(startPos, pos).join("");
  tokens.push(createToken(color, value));
  return pos;
}

function handleNumber(tokens: Token[], inputChars: string[], pos: number, color: string): number {
  const startPos = pos;
  while (pos < inputChars.length && /\d/.test(inputChars[pos])) pos++;
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
  identifierColor: string
): number {
  const startPos = pos;
  while (pos < inputChars.length && /[a-zA-Z0-9_]/.test(inputChars[pos])) pos++;
  const value = inputChars.slice(startPos, pos).join("");
  const nextChar = inputChars[pos] || " ";

  if (nextChar === "(") {
    tokens.push(createToken(functionNameColor, value));
  } else if (RUST_KEYWORDS.includes(value)) {
    tokens.push(createToken(keywordColor, value));
  } else {
    tokens.push(createToken(identifierColor, value));
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

export function tokenizeRustCode(input: string): Token[] | null {
  const tokens: Token[] = [];

  if (!syntaxHighlight || !langTokenTypes) {
    syntaxHighlight = store.state.settings.syntaxHighlight;
    if (!syntaxHighlight) return null;

    langTokenTypes = syntaxHighlight.languages.find((lang) => lang.language === "rust");
    if (!langTokenTypes) return null;
  }

  let pos = 0;
  const inputChars = Array.from(input);

  while (pos < inputChars.length) {
    const currentChar = inputChars[pos];

    if (/\s/.test(currentChar)) {
      pos = handleWhitespace(tokens, inputChars, pos, langTokenTypes.whitespaceColor);
    } else if (currentChar === "#") {
      pos = handleAttribute(tokens, inputChars, pos, langTokenTypes.attributeColor);
    } else if (
      currentChar === "/" &&
      (inputChars[pos + 1] === "/" || inputChars[pos + 1] === "*")
    ) {
      pos = handleComment(tokens, inputChars, pos, langTokenTypes.commentColor);
    } else if (currentChar === '"' || currentChar === "'") {
      pos = handleStringLiteral(tokens, inputChars, pos, langTokenTypes.stringLiteralColor);
    } else if (currentChar === "'" && /[a-zA-Z0-9]/.test(inputChars[pos + 1])) {
      pos = handleLifetime(tokens, inputChars, pos, langTokenTypes.lifetimeColor);
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
        langTokenTypes.identifierColor
      );
    } else if (",.:;()[]{}<>".includes(currentChar)) {
      pos = handlePunctuation(tokens, currentChar, pos, langTokenTypes.punctuationColor);
    } else {
      pos = handleUnknown(tokens, currentChar, pos, langTokenTypes.unknownColor);
    }
  }
  return tokens;
}
