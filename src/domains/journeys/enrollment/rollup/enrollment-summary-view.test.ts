import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentSummaryView, toEnrollmentSummaryViews } from "./enrollment-summary-view.js";
import { newEnrollmentSummary } from "./enrollment-summary.js";

test("EnrollmentSummaryView shows the status in capitals", () => {
  const item = newEnrollmentSummary("code-390", "title-873");
  const view = toEnrollmentSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentSummaryViews([item, item]).length, 2, "views");
});
