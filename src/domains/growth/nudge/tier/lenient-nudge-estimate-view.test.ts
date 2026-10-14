import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientNudgeEstimateView, toLenientNudgeEstimateViews } from "./lenient-nudge-estimate-view.js";
import { newLenientNudgeEstimate } from "./lenient-nudge-estimate.js";

test("LenientNudgeEstimateView shows the status in capitals", () => {
  const item = newLenientNudgeEstimate("code-607", "name-389");
  const view = toLenientNudgeEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientNudgeEstimateViews([item, item]).length, 2, "views");
});
