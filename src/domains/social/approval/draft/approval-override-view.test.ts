import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalOverrideView, toApprovalOverrideViews } from "./approval-override-view.js";
import { newApprovalOverride } from "./approval-override.js";

test("ApprovalOverrideView shows the status in capitals", () => {
  const item = newApprovalOverride("code-751", "title-427");
  const view = toApprovalOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalOverrideViews([item, item]).length, 2, "views");
});
