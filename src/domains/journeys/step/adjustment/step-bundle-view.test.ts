import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepBundleView, toStepBundleViews } from "./step-bundle-view.js";
import { newStepBundle } from "./step-bundle.js";

test("StepBundleView shows the status in capitals", () => {
  const item = newStepBundle("code-431", "title-583");
  const view = toStepBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepBundleViews([item, item]).length, 2, "views");
});
