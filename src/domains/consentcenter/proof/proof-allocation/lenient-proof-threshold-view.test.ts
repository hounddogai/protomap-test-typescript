import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientProofThresholdView, toLenientProofThresholdViews } from "./lenient-proof-threshold-view.js";
import { newLenientProofThreshold } from "./lenient-proof-threshold.js";

test("LenientProofThresholdView shows the status in capitals", () => {
  const item = newLenientProofThreshold("code-981", "title-444");
  const view = toLenientProofThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientProofThresholdViews([item, item]).length, 2, "views");
});
