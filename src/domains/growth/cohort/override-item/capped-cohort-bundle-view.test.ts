import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedCohortBundleView, toCappedCohortBundleViews } from "./capped-cohort-bundle-view.js";
import { newCappedCohortBundle } from "./capped-cohort-bundle.js";

test("CappedCohortBundleView shows the status in capitals", () => {
  const item = newCappedCohortBundle("code-113", "name-852");
  const view = toCappedCohortBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedCohortBundleViews([item, item]).length, 2, "views");
});
