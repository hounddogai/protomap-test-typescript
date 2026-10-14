import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedCohortExceptionView, toWeightedCohortExceptionViews } from "./weighted-cohort-exception-view.js";
import { newWeightedCohortException } from "./weighted-cohort-exception.js";

test("WeightedCohortExceptionView shows the status in capitals", () => {
  const item = newWeightedCohortException("code-24", "label-544");
  const view = toWeightedCohortExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedCohortExceptionViews([item, item]).length, 2, "views");
});
