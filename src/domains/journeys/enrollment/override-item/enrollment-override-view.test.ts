import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentOverrideView, toEnrollmentOverrideViews } from "./enrollment-override-view.js";
import { newEnrollmentOverride } from "./enrollment-override.js";

test("EnrollmentOverrideView shows the status in capitals", () => {
  const item = newEnrollmentOverride("code-148", "title-781");
  const view = toEnrollmentOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentOverrideViews([item, item]).length, 2, "views");
});
