import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalRedemptionGroupView, toRegionalRedemptionGroupViews } from "./regional-redemption-group-view.js";
import { newRegionalRedemptionGroup } from "./regional-redemption-group.js";

test("RegionalRedemptionGroupView shows the status in capitals", () => {
  const item = newRegionalRedemptionGroup("code-666", "name-245");
  const view = toRegionalRedemptionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRedemptionGroupViews([item, item]).length, 2, "views");
});
