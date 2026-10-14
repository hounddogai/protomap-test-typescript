import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledCohortExceptionView,
  toScheduledCohortExceptionViews,
} from "./scheduled-cohort-exception-view.js";
import { newScheduledCohortException } from "./scheduled-cohort-exception.js";

test("ScheduledCohortExceptionView shows the status in capitals", () => {
  const item = newScheduledCohortException("code-182", "name-742");
  const view = toScheduledCohortExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledCohortExceptionViews([item, item]).length, 2, "views");
});
