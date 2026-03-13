const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src");
const m = JSON.parse(fs.readFileSync(path.join(src, "manifest.json"), "utf8"));
const errors = [];

// Manifest fields
if (m.manifest_version !== 3) errors.push("Not MV3");
if (!m.name) errors.push("Missing name");
if (!m.version) errors.push("Missing version");
if (!m.permissions || !m.permissions.includes("tabs")) errors.push("Missing tabs permission");
if (!m.action || !m.action.default_popup) errors.push("Missing default_popup");
if (!m.commands || !m.commands._execute_action) errors.push("Missing _execute_action command");
if (!m.background || !m.background.service_worker) errors.push("Missing background service worker");
if (!m.options_ui || !m.options_ui.page) errors.push("Missing options_ui page");

// Collect all referenced files from manifest
const files = [m.action.default_popup]
  .concat(Object.values(m.action.default_icon || {}))
  .concat(Object.values(m.icons || {}))
  .concat(m.background && m.background.service_worker ? [m.background.service_worker] : [])
  .concat(m.options_ui && m.options_ui.page ? [m.options_ui.page] : []);

const unique = [...new Set(files)];
for (const f of unique) {
  const full = path.join(src, f);
  if (!fs.existsSync(full)) {
    errors.push("Missing file: " + f);
  } else {
    const stat = fs.statSync(full);
    console.log("  OK:", f, "(" + stat.size + " bytes)");
  }
}

// Check popup.html references
const popupHtml = fs.readFileSync(path.join(src, m.action.default_popup), "utf8");
checkHtmlRefs(popupHtml, "popup");

// Check options.html references
if (m.options_ui && m.options_ui.page) {
  const optionsHtml = fs.readFileSync(path.join(src, m.options_ui.page), "utf8");
  checkHtmlRefs(optionsHtml, "options");
}

function checkHtmlRefs(html, dir) {
  const cssRefs = html.match(/href="([^"]+\.css)"/g) || [];
  const jsRefs = html.match(/src="([^"]+\.js)"/g) || [];

  for (const ref of cssRefs) {
    const file = ref.match(/href="([^"]+)"/)[1];
    if (file.startsWith("http")) continue;
    const resolved = file.startsWith("../") ? file.slice(3) : dir + "/" + file;
    const full = path.join(src, resolved);
    if (!fs.existsSync(full)) {
      errors.push("Missing CSS in " + dir + ": " + file);
    } else {
      console.log("  OK:", resolved);
    }
  }

  for (const ref of jsRefs) {
    const file = ref.match(/src="([^"]+)"/)[1];
    if (file.startsWith("http")) continue;
    const resolved = file.startsWith("../") ? file.slice(3) : dir + "/" + file;
    const full = path.join(src, resolved);
    if (!fs.existsSync(full)) {
      errors.push("Missing JS in " + dir + ": " + file);
    } else {
      console.log("  OK:", resolved);
    }
  }
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
