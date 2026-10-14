import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentDigestView, toEnrollmentDigestViews } from "./enrollment-digest-view.js";
import { newEnrollmentDigest } from "./enrollment-digest.js";

test("EnrollmentDigestView shows the status in capitals", () => {
  const item = newEnrollmentDigest("code-934", "label-571");
  const view = toEnrollmentDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentDigestViews([item, item]).length, 2, "views");
});
