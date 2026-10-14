import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingProofAllocationView, toRollingProofAllocationViews } from "./rolling-proof-allocation-view.js";
import { newRollingProofAllocation } from "./rolling-proof-allocation.js";

test("RollingProofAllocationView shows the status in capitals", () => {
  const item = newRollingProofAllocation("code-410", "title-346");
  const view = toRollingProofAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingProofAllocationViews([item, item]).length, 2, "views");
});
