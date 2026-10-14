import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalTierSlotView, toRegionalTierSlotViews } from "./regional-tier-slot-view.js";
import { newRegionalTierSlot } from "./regional-tier-slot.js";

test("RegionalTierSlotView shows the status in capitals", () => {
  const item = newRegionalTierSlot("code-207", "name-499");
  const view = toRegionalTierSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalTierSlotViews([item, item]).length, 2, "views");
});
