import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalEnrollmentTierView, toGlobalEnrollmentTierViews } from "./global-enrollment-tier-view.js";
import { newGlobalEnrollmentTier } from "./global-enrollment-tier.js";

test("GlobalEnrollmentTierView shows the status in capitals", () => {
  const item = newGlobalEnrollmentTier("code-219", "name-223");
  const view = toGlobalEnrollmentTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalEnrollmentTierViews([item, item]).length, 2, "views");
});
