import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceAdjustmentView, toPreferenceAdjustmentViews } from "./preference-adjustment-view.js";
import { newPreferenceAdjustment } from "./preference-adjustment.js";

test("PreferenceAdjustmentView shows the status in capitals", () => {
  const item = newPreferenceAdjustment("code-629", "title-690");
  const view = toPreferenceAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceAdjustmentViews([item, item]).length, 2, "views");
});
