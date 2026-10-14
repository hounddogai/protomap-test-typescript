import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWindowSlotView, toLegacyWindowSlotViews } from "./legacy-window-slot-view.js";
import { newLegacyWindowSlot } from "./legacy-window-slot.js";

test("LegacyWindowSlotView shows the status in capitals", () => {
  const item = newLegacyWindowSlot("code-843", "title-291");
  const view = toLegacyWindowSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWindowSlotViews([item, item]).length, 2, "views");
});
