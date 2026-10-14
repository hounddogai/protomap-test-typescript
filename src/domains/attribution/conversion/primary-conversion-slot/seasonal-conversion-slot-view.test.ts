import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalConversionSlotView, toSeasonalConversionSlotViews } from "./seasonal-conversion-slot-view.js";
import { newSeasonalConversionSlot } from "./seasonal-conversion-slot.js";

test("SeasonalConversionSlotView shows the status in capitals", () => {
  const item = newSeasonalConversionSlot("code-570", "name-869");
  const view = toSeasonalConversionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalConversionSlotViews([item, item]).length, 2, "views");
});
