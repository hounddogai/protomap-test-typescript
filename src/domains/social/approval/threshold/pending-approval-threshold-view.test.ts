import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingApprovalThresholdView,
  toPendingApprovalThresholdViews,
} from "./pending-approval-threshold-view.js";
import { newPendingApprovalThreshold } from "./pending-approval-threshold.js";

test("PendingApprovalThresholdView shows the status in capitals", () => {
  const item = newPendingApprovalThreshold("code-768", "name-829");
  const view = toPendingApprovalThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingApprovalThresholdViews([item, item]).length, 2, "views");
});
