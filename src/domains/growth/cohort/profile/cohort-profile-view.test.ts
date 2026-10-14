import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortProfileView, toCohortProfileViews } from "./cohort-profile-view.js";
import { newCohortProfile } from "./cohort-profile.js";

test("CohortProfileView shows the status in capitals", () => {
  const item = newCohortProfile("code-786", "title-724");
  const view = toCohortProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortProfileViews([item, item]).length, 2, "views");
});
