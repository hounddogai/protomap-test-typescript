import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentBundleView, toEnrollmentBundleViews } from "./enrollment-bundle-view.js";
import { newEnrollmentBundle } from "./enrollment-bundle.js";

test("EnrollmentBundleView shows the status in capitals", () => {
  const item = newEnrollmentBundle("code-795", "title-22");
  const view = toEnrollmentBundleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentBundleViews([item, item]).length, 2, "views");
});
