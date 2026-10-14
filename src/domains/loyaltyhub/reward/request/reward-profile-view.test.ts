import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardProfileView, toRewardProfileViews } from "./reward-profile-view.js";
import { newRewardProfile } from "./reward-profile.js";

test("RewardProfileView shows the status in capitals", () => {
  const item = newRewardProfile("code-568", "label-303");
  const view = toRewardProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardProfileViews([item, item]).length, 2, "views");
});
