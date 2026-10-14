import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofAdjustmentView, toProofAdjustmentViews } from "./proof-adjustment-view.js";
import { newProofAdjustment } from "./proof-adjustment.js";

test("ProofAdjustmentView shows the status in capitals", () => {
  const item = newProofAdjustment("code-603", "title-264");
  const view = toProofAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofAdjustmentViews([item, item]).length, 2, "views");
});
