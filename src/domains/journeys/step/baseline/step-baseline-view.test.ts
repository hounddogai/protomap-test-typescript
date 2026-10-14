import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepBaselineView, toStepBaselineViews } from "./step-baseline-view.js";
import { newStepBaseline } from "./step-baseline.js";

test("StepBaselineView shows the status in capitals", () => {
  const item = newStepBaseline("code-360", "title-359");
  const view = toStepBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepBaselineViews([item, item]).length, 2, "views");
});
