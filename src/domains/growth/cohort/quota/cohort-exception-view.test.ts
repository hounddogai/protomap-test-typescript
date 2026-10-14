import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortExceptionView, toCohortExceptionViews } from "./cohort-exception-view.js";
import { newCohortException } from "./cohort-exception.js";

test("CohortExceptionView shows the status in capitals", () => {
  const item = newCohortException("code-150", "name-488");
  const view = toCohortExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortExceptionViews([item, item]).length, 2, "views");
});
