import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualInsightAdjustmentView, toManualInsightAdjustmentViews } from "./manual-insight-adjustment-view.js";
import { newManualInsightAdjustment } from "./manual-insight-adjustment.js";

test("ManualInsightAdjustmentView shows the status in capitals", () => {
  const item = newManualInsightAdjustment("code-685", "title-38");
  const view = toManualInsightAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualInsightAdjustmentViews([item, item]).length, 2, "views");
});
