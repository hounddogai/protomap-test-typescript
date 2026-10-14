import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCohortBundleView, toBatchedCohortBundleViews } from "./batched-cohort-bundle-view.js";
import { newBatchedCohortBundle } from "./batched-cohort-bundle.js";

test("BatchedCohortBundleView shows the status in capitals", () => {
  const item = newBatchedCohortBundle("code-841", "label-349");
  const view = toBatchedCohortBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCohortBundleViews([item, item]).length, 2, "views");
});
