import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingAllocationView, toPacingAllocationViews } from "./pacing-allocation-view.js";
import { newPacingAllocation } from "./pacing-allocation.js";

test("PacingAllocationView shows the status in capitals", () => {
  const item = newPacingAllocation("code-629", "name-621");
  const view = toPacingAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingAllocationViews([item, item]).length, 2, "views");
});
