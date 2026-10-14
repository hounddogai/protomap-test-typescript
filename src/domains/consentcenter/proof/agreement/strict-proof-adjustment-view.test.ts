import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictProofAdjustmentView, toStrictProofAdjustmentViews } from "./strict-proof-adjustment-view.js";
import { newStrictProofAdjustment } from "./strict-proof-adjustment.js";

test("StrictProofAdjustmentView shows the status in capitals", () => {
  const item = newStrictProofAdjustment("code-788", "title-279");
  const view = toStrictProofAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictProofAdjustmentViews([item, item]).length, 2, "views");
});
