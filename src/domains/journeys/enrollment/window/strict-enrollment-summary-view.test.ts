import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictEnrollmentSummaryView, toStrictEnrollmentSummaryViews } from "./strict-enrollment-summary-view.js";
import { newStrictEnrollmentSummary } from "./strict-enrollment-summary.js";

test("StrictEnrollmentSummaryView shows the status in capitals", () => {
  const item = newStrictEnrollmentSummary("code-506", "title-181");
  const view = toStrictEnrollmentSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictEnrollmentSummaryViews([item, item]).length, 2, "views");
});
