import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalSuppressionProfileView,
  toRegionalSuppressionProfileViews,
} from "./regional-suppression-profile-view.js";
import { newRegionalSuppressionProfile } from "./regional-suppression-profile.js";

test("RegionalSuppressionProfileView shows the status in capitals", () => {
  const item = newRegionalSuppressionProfile("code-998", "label-784");
  const view = toRegionalSuppressionProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSuppressionProfileViews([item, item]).length, 2, "views");
});
