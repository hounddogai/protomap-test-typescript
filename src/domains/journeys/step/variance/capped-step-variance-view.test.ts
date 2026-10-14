import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedStepVarianceView, toCappedStepVarianceViews } from "./capped-step-variance-view.js";
import { newCappedStepVariance } from "./capped-step-variance.js";

test("CappedStepVarianceView shows the status in capitals", () => {
  const item = newCappedStepVariance("code-224", "title-323");
  const view = toCappedStepVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedStepVarianceViews([item, item]).length, 2, "views");
});
