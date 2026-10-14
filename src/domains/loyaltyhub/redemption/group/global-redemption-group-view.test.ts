import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalRedemptionGroupView, toGlobalRedemptionGroupViews } from "./global-redemption-group-view.js";
import { newGlobalRedemptionGroup } from "./global-redemption-group.js";

test("GlobalRedemptionGroupView shows the status in capitals", () => {
  const item = newGlobalRedemptionGroup("code-945", "name-418");
  const view = toGlobalRedemptionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRedemptionGroupViews([item, item]).length, 2, "views");
});
