import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientRewardProfileView, toLenientRewardProfileViews } from "./lenient-reward-profile-view.js";
import { newLenientRewardProfile } from "./lenient-reward-profile.js";

test("LenientRewardProfileView shows the status in capitals", () => {
  const item = newLenientRewardProfile("code-969", "label-275");
  const view = toLenientRewardProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientRewardProfileViews([item, item]).length, 2, "views");
});
