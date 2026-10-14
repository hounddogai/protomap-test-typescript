import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRedemptionGroupView, toTieredRedemptionGroupViews } from "./tiered-redemption-group-view.js";
import { newTieredRedemptionGroup } from "./tiered-redemption-group.js";

test("TieredRedemptionGroupView shows the status in capitals", () => {
  const item = newTieredRedemptionGroup("code-229", "title-479");
  const view = toTieredRedemptionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRedemptionGroupViews([item, item]).length, 2, "views");
});
