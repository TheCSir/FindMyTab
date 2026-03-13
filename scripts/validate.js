const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const m = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const errors = [];

if (m.manifest_version !== 3) errors.push("Not MV3");
if (!m.name) errors.push("Missing name");
if (!m.version) errors.push("Missing version");
if (!m.permissions || !m.permissions.includes("tabs")) errors.push("Missing tabs permission");
if (!m.action || !m.action.default_popup) errors.push("Missing default_popup");
if (!m.commands || !m.commands._execute_action) errors.push("Missing _execute_action command");

const files = [m.action.default_popup]
  .concat(Object.values(m.action.default_icon || {}))
  .concat(Object.values(m.icons || {}));

const unique = [...new Set(files)];
for (const f of unique) {
  const full = path.join(root, f);
  if (!fs.existsSync(full)) {
    errors.push("Missing file: " + f);
  } else {
    const stat = fs.statSync(full);
    console.log("  OK:", f, "(" + stat.size + " bytes)");
  }
}

// Check popup.html references
const popupHtml = fs.readFileSync(path.join(root, m.action.default_popup), "utf8");
const cssMatch = popupHtml.match(/href="([^"]+\.css)"/);
const jsMatch = popupHtml.match(/src="([^"]+\.js)"/);

if (cssMatch) {
  const cssPath = path.join(root, "popup", cssMatch[1]);
  if (!fs.existsSync(cssPath)) errors.push("Missing CSS: " + cssMatch[1]);
  else console.log("  OK:", "popup/" + cssMatch[1]);
}
if (jsMatch) {
  const jsPath = path.join(root, "popup", jsMatch[1]);
  if (!fs.existsSync(jsPath)) errors.push("Missing JS: " + jsMatch[1]);
  else console.log("  OK:", "popup/" + jsMatch[1]);
}

console.log("");
if (errors.length === 0) {
  console.log("PASS: Extension structure is valid");
  console.log("  Name:", m.name);
  console.log("  Version:", m.version);
  console.log("  Permissions:", m.permissions.join(", "));
  console.log("  Hotkey:", m.commands._execute_action.suggested_key.default);
} else {
  console.log("FAIL:", errors.length, "error(s)");
  errors.forEach((e) => console.log("  -", e));
  process.exit(1);
}
