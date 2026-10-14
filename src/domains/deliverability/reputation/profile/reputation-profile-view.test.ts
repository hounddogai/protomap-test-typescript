import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationProfileView, toReputationProfileViews } from "./reputation-profile-view.js";
import { newReputationProfile } from "./reputation-profile.js";

test("ReputationProfileView shows the status in capitals", () => {
  const item = newReputationProfile("code-297", "label-507");
  const view = toReputationProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationProfileViews([item, item]).length, 2, "views");
});
