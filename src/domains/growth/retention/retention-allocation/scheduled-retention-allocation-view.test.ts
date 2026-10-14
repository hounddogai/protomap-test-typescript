import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledRetentionAllocationView,
  toScheduledRetentionAllocationViews,
} from "./scheduled-retention-allocation-view.js";
import { newScheduledRetentionAllocation } from "./scheduled-retention-allocation.js";

test("ScheduledRetentionAllocationView shows the status in capitals", () => {
  const item = newScheduledRetentionAllocation("code-498", "name-411");
  const view = toScheduledRetentionAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledRetentionAllocationViews([item, item]).length, 2, "views");
});
