import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCsatProfileView, toRollingCsatProfileViews } from "./rolling-csat-profile-view.js";
import { newRollingCsatProfile } from "./rolling-csat-profile.js";

test("RollingCsatProfileView shows the status in capitals", () => {
  const item = newRollingCsatProfile("code-254", "label-460");
  const view = toRollingCsatProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCsatProfileViews([item, item]).length, 2, "views");
});
