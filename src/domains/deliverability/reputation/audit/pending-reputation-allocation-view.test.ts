import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingReputationAllocationView,
  toPendingReputationAllocationViews,
} from "./pending-reputation-allocation-view.js";
import { newPendingReputationAllocation } from "./pending-reputation-allocation.js";

test("PendingReputationAllocationView shows the status in capitals", () => {
  const item = newPendingReputationAllocation("code-111", "name-850");
  const view = toPendingReputationAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingReputationAllocationViews([item, item]).length, 2, "views");
});
