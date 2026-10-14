import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallAssignmentView, toPaywallAssignmentViews } from "./paywall-assignment-view.js";
import { newPaywallAssignment } from "./paywall-assignment.js";

test("PaywallAssignmentView shows the status in capitals", () => {
  const item = newPaywallAssignment("code-543", "title-951");
  const view = toPaywallAssignmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallAssignmentViews([item, item]).length, 2, "views");
});
