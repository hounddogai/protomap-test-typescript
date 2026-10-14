import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingStepVarianceView, toRollingStepVarianceViews } from "./rolling-step-variance-view.js";
import { newRollingStepVariance } from "./rolling-step-variance.js";

test("RollingStepVarianceView shows the status in capitals", () => {
  const item = newRollingStepVariance("code-707", "label-82");
  const view = toRollingStepVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingStepVarianceViews([item, item]).length, 2, "views");
});
