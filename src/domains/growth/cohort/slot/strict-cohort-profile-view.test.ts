import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictCohortProfileView, toStrictCohortProfileViews } from "./strict-cohort-profile-view.js";
import { newStrictCohortProfile } from "./strict-cohort-profile.js";

test("StrictCohortProfileView shows the status in capitals", () => {
  const item = newStrictCohortProfile("code-471", "name-806");
  const view = toStrictCohortProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictCohortProfileViews([item, item]).length, 2, "views");
});
