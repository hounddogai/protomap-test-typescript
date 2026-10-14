import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalBadgeSlotView, toSeasonalBadgeSlotViews } from "./seasonal-badge-slot-view.js";
import { newSeasonalBadgeSlot } from "./seasonal-badge-slot.js";

test("SeasonalBadgeSlotView shows the status in capitals", () => {
  const item = newSeasonalBadgeSlot("code-38", "name-638");
  const view = toSeasonalBadgeSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalBadgeSlotViews([item, item]).length, 2, "views");
});
