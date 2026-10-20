// React renders these tokens as text, including any HTML embedded in JSON strings.
/** @param {string} text */
export function jsonTokens(text) {
  return text.split(/("(?:\\.|[^"\\])*"\s*(?=:)|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g)
    .filter(Boolean)
    .map((value, index, parts) => {
      let kind = "plain";
      if (value.startsWith('"')) kind = parts[index + 1]?.startsWith(":") ? "key" : "string";
      else if (/^(true|false)$/.test(value)) kind = "boolean";
      else if (value === "null") kind = "null";
      else if (/^-?\d/.test(value)) kind = "number";
      return { value, kind };
    });
}
