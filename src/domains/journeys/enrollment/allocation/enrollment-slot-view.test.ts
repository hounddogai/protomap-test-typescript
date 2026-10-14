import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentSlotView, toEnrollmentSlotViews } from "./enrollment-slot-view.js";
import { newEnrollmentSlot } from "./enrollment-slot.js";

test("EnrollmentSlotView shows the status in capitals", () => {
  const item = newEnrollmentSlot("code-565", "title-316");
  const view = toEnrollmentSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentSlotViews([item, item]).length, 2, "views");
});
