import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroOverrideView, toMacroOverrideViews } from "./macro-override-view.js";
import { newMacroOverride } from "./macro-override.js";

test("MacroOverrideView shows the status in capitals", () => {
  const item = newMacroOverride("code-212", "label-715");
  const view = toMacroOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroOverrideViews([item, item]).length, 2, "views");
});
