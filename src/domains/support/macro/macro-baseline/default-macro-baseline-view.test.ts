import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultMacroBaselineView, toDefaultMacroBaselineViews } from "./default-macro-baseline-view.js";
import { newDefaultMacroBaseline } from "./default-macro-baseline.js";

test("DefaultMacroBaselineView shows the status in capitals", () => {
  const item = newDefaultMacroBaseline("code-542", "name-696");
  const view = toDefaultMacroBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultMacroBaselineViews([item, item]).length, 2, "views");
});
