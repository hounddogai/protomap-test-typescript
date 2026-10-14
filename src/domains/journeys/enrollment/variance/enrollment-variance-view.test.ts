import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentVarianceView, toEnrollmentVarianceViews } from "./enrollment-variance-view.js";
import { newEnrollmentVariance } from "./enrollment-variance.js";

test("EnrollmentVarianceView shows the status in capitals", () => {
  const item = newEnrollmentVariance("code-137", "name-128");
  const view = toEnrollmentVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentVarianceViews([item, item]).length, 2, "views");
});
