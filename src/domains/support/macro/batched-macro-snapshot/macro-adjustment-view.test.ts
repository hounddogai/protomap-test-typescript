import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroAdjustmentView, toMacroAdjustmentViews } from "./macro-adjustment-view.js";
import { newMacroAdjustment } from "./macro-adjustment.js";

test("MacroAdjustmentView shows the status in capitals", () => {
  const item = newMacroAdjustment("code-491", "title-880");
  const view = toMacroAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroAdjustmentViews([item, item]).length, 2, "views");
});
