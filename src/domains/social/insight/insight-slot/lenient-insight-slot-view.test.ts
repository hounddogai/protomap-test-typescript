import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientInsightSlotView, toLenientInsightSlotViews } from "./lenient-insight-slot-view.js";
import { newLenientInsightSlot } from "./lenient-insight-slot.js";

test("LenientInsightSlotView shows the status in capitals", () => {
  const item = newLenientInsightSlot("code-302", "title-263");
  const view = toLenientInsightSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientInsightSlotViews([item, item]).length, 2, "views");
});
