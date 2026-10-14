import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCohortVarianceView, toPendingCohortVarianceViews } from "./pending-cohort-variance-view.js";
import { newPendingCohortVariance } from "./pending-cohort-variance.js";

test("PendingCohortVarianceView shows the status in capitals", () => {
  const item = newPendingCohortVariance("code-371", "label-402");
  const view = toPendingCohortVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCohortVarianceViews([item, item]).length, 2, "views");
});
