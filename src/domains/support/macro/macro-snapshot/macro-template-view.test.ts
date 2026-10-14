import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroTemplateView, toMacroTemplateViews } from "./macro-template-view.js";
import { newMacroTemplate } from "./macro-template.js";

test("MacroTemplateView shows the status in capitals", () => {
  const item = newMacroTemplate("code-592", "label-154");
  const view = toMacroTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroTemplateViews([item, item]).length, 2, "views");
});
