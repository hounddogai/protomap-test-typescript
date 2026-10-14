import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveEnrollmentGroupView, toAdaptiveEnrollmentGroupViews } from "./adaptive-enrollment-group-view.js";
import { newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

test("AdaptiveEnrollmentGroupView shows the status in capitals", () => {
  const item = newAdaptiveEnrollmentGroup("code-980", "label-68");
  const view = toAdaptiveEnrollmentGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveEnrollmentGroupViews([item, item]).length, 2, "views");
});
