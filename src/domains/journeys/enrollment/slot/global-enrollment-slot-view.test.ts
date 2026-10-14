import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalEnrollmentSlotView, toGlobalEnrollmentSlotViews } from "./global-enrollment-slot-view.js";
import { newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

test("GlobalEnrollmentSlotView shows the status in capitals", () => {
  const item = newGlobalEnrollmentSlot("code-857", "title-273");
  const view = toGlobalEnrollmentSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalEnrollmentSlotViews([item, item]).length, 2, "views");
});
