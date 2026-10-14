import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingOptOutTierView, toPendingOptOutTierViews } from "./pending-opt-out-tier-view.js";
import { newPendingOptOutTier } from "./pending-opt-out-tier.js";

test("PendingOptOutTierView shows the status in capitals", () => {
  const item = newPendingOptOutTier("code-104", "name-415");
  const view = toPendingOptOutTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingOptOutTierViews([item, item]).length, 2, "views");
});
