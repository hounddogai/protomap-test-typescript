import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedNudgeAllocationView, toCappedNudgeAllocationViews } from "./capped-nudge-allocation-view.js";
import { newCappedNudgeAllocation } from "./capped-nudge-allocation.js";

test("CappedNudgeAllocationView shows the status in capitals", () => {
  const item = newCappedNudgeAllocation("code-989", "label-168");
  const view = toCappedNudgeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedNudgeAllocationViews([item, item]).length, 2, "views");
});
