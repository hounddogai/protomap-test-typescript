import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingApprovalAllocationView,
  toPendingApprovalAllocationViews,
} from "./pending-approval-allocation-view.js";
import { newPendingApprovalAllocation } from "./pending-approval-allocation.js";

test("PendingApprovalAllocationView shows the status in capitals", () => {
  const item = newPendingApprovalAllocation("code-628", "name-207");
  const view = toPendingApprovalAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingApprovalAllocationViews([item, item]).length, 2, "views");
});
