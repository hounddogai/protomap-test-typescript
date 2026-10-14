import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedEnrollmentSlotView, toWeightedEnrollmentSlotViews } from "./weighted-enrollment-slot-view.js";
import { newWeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

test("WeightedEnrollmentSlotView shows the status in capitals", () => {
  const item = newWeightedEnrollmentSlot("code-204", "title-774");
  const view = toWeightedEnrollmentSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedEnrollmentSlotViews([item, item]).length, 2, "views");
});
