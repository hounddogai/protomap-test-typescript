import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBadgeProfileView, toTieredBadgeProfileViews } from "./tiered-badge-profile-view.js";
import { newTieredBadgeProfile } from "./tiered-badge-profile.js";

test("TieredBadgeProfileView shows the status in capitals", () => {
  const item = newTieredBadgeProfile("code-675", "title-744");
  const view = toTieredBadgeProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBadgeProfileViews([item, item]).length, 2, "views");
});
