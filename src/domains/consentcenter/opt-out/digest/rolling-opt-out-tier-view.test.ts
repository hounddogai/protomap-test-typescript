import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingOptOutTierView, toRollingOptOutTierViews } from "./rolling-opt-out-tier-view.js";
import { newRollingOptOutTier } from "./rolling-opt-out-tier.js";

test("RollingOptOutTierView shows the status in capitals", () => {
  const item = newRollingOptOutTier("code-183", "title-690");
  const view = toRollingOptOutTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingOptOutTierViews([item, item]).length, 2, "views");
});
