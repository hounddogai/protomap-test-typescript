import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictEnrollmentAdjustmentView,
  toStrictEnrollmentAdjustmentViews,
} from "./strict-enrollment-adjustment-view.js";
import { newStrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

test("StrictEnrollmentAdjustmentView shows the status in capitals", () => {
  const item = newStrictEnrollmentAdjustment("code-817", "name-223");
  const view = toStrictEnrollmentAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictEnrollmentAdjustmentViews([item, item]).length, 2, "views");
});
