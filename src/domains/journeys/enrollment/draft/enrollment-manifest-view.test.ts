import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentManifestView, toEnrollmentManifestViews } from "./enrollment-manifest-view.js";
import { newEnrollmentManifest } from "./enrollment-manifest.js";

test("EnrollmentManifestView shows the status in capitals", () => {
  const item = newEnrollmentManifest("code-844", "name-5");
  const view = toEnrollmentManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentManifestViews([item, item]).length, 2, "views");
});
