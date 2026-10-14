import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofThresholdView, toProofThresholdViews } from "./proof-threshold-view.js";
import { newProofThreshold } from "./proof-threshold.js";

test("ProofThresholdView shows the status in capitals", () => {
  const item = newProofThreshold("code-825", "label-840");
  const view = toProofThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofThresholdViews([item, item]).length, 2, "views");
});
