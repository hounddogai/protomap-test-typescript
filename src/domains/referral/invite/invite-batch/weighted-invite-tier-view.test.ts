import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedInviteTierView, toWeightedInviteTierViews } from "./weighted-invite-tier-view.js";
import { newWeightedInviteTier } from "./weighted-invite-tier.js";

test("WeightedInviteTierView shows the status in capitals", () => {
  const item = newWeightedInviteTier("code-19", "name-27");
  const view = toWeightedInviteTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedInviteTierViews([item, item]).length, 2, "views");
});
