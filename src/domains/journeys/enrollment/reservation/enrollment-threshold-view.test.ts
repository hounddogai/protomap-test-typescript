import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentThresholdView, toEnrollmentThresholdViews } from "./enrollment-threshold-view.js";
import { newEnrollmentThreshold } from "./enrollment-threshold.js";

test("EnrollmentThresholdView shows the status in capitals", () => {
  const item = newEnrollmentThreshold("code-527", "name-56");
  const view = toEnrollmentThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentThresholdViews([item, item]).length, 2, "views");
});
