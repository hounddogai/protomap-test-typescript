import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentTargetView, toEnrollmentTargetViews } from "./enrollment-target-view.js";
import { newEnrollmentTarget } from "./enrollment-target.js";

test("EnrollmentTargetView shows the status in capitals", () => {
  const item = newEnrollmentTarget("code-287", "name-658");
  const view = toEnrollmentTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentTargetViews([item, item]).length, 2, "views");
});
