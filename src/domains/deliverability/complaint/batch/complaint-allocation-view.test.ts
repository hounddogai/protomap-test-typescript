import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintAllocationView, toComplaintAllocationViews } from "./complaint-allocation-view.js";
import { newComplaintAllocation } from "./complaint-allocation.js";

test("ComplaintAllocationView shows the status in capitals", () => {
  const item = newComplaintAllocation("code-694", "name-188");
  const view = toComplaintAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintAllocationViews([item, item]).length, 2, "views");
});
