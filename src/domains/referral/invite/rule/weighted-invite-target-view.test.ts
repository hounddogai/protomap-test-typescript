import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedInviteTargetView, toWeightedInviteTargetViews } from "./weighted-invite-target-view.js";
import { newWeightedInviteTarget } from "./weighted-invite-target.js";

test("WeightedInviteTargetView shows the status in capitals", () => {
  const item = newWeightedInviteTarget("code-13", "title-734");
  const view = toWeightedInviteTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedInviteTargetViews([item, item]).length, 2, "views");
});
