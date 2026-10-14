import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortSlotView, toCohortSlotViews } from "./cohort-slot-view.js";
import { newCohortSlot } from "./cohort-slot.js";

test("CohortSlotView shows the status in capitals", () => {
  const item = newCohortSlot("code-362", "label-838");
  const view = toCohortSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortSlotViews([item, item]).length, 2, "views");
});
