import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionAllocationView, toRetentionAllocationViews } from "./retention-allocation-view.js";
import { newRetentionAllocation } from "./retention-allocation.js";

test("RetentionAllocationView shows the status in capitals", () => {
  const item = newRetentionAllocation("code-103", "label-888");
  const view = toRetentionAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionAllocationViews([item, item]).length, 2, "views");
});
