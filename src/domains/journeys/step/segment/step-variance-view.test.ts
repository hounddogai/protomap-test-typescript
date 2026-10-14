import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepVarianceView, toStepVarianceViews } from "./step-variance-view.js";
import { newStepVariance } from "./step-variance.js";

test("StepVarianceView shows the status in capitals", () => {
  const item = newStepVariance("code-703", "name-371");
  const view = toStepVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepVarianceViews([item, item]).length, 2, "views");
});
