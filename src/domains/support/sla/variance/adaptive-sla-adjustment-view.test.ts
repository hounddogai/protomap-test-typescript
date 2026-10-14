import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveSlaAdjustmentView, toAdaptiveSlaAdjustmentViews } from "./adaptive-sla-adjustment-view.js";
import { newAdaptiveSlaAdjustment } from "./adaptive-sla-adjustment.js";

test("AdaptiveSlaAdjustmentView shows the status in capitals", () => {
  const item = newAdaptiveSlaAdjustment("code-330", "label-504");
  const view = toAdaptiveSlaAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSlaAdjustmentViews([item, item]).length, 2, "views");
});
