import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCohortExceptionView, toRollingCohortExceptionViews } from "./rolling-cohort-exception-view.js";
import { newRollingCohortException } from "./rolling-cohort-exception.js";

test("RollingCohortExceptionView shows the status in capitals", () => {
  const item = newRollingCohortException("code-77", "name-748");
  const view = toRollingCohortExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCohortExceptionViews([item, item]).length, 2, "views");
});
