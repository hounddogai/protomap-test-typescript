import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalDoubleOptInSlotView, toSeasonalDoubleOptInSlotViews } from "./seasonal-double-opt-in-slot-view.js";
import { newSeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

test("SeasonalDoubleOptInSlotView shows the status in capitals", () => {
  const item = newSeasonalDoubleOptInSlot("code-758", "name-183");
  const view = toSeasonalDoubleOptInSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDoubleOptInSlotViews([item, item]).length, 2, "views");
});
