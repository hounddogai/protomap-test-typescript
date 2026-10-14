import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentProfileView, toEnrollmentProfileViews } from "./enrollment-profile-view.js";
import { newEnrollmentProfile } from "./enrollment-profile.js";

test("EnrollmentProfileView shows the status in capitals", () => {
  const item = newEnrollmentProfile("code-662", "name-397");
  const view = toEnrollmentProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentProfileViews([item, item]).length, 2, "views");
});
