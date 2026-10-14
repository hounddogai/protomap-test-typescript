import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeEstimateView, toNudgeEstimateViews } from "./nudge-estimate-view.js";
import { newNudgeEstimate } from "./nudge-estimate.js";

test("NudgeEstimateView shows the status in capitals", () => {
  const item = newNudgeEstimate("code-244", "label-847");
  const view = toNudgeEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeEstimateViews([item, item]).length, 2, "views");
});
