import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictBadgeAllocationView, toStrictBadgeAllocationViews } from "./strict-badge-allocation-view.js";
import { newStrictBadgeAllocation } from "./strict-badge-allocation.js";

test("StrictBadgeAllocationView shows the status in capitals", () => {
  const item = newStrictBadgeAllocation("code-522", "title-804");
  const view = toStrictBadgeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictBadgeAllocationViews([item, item]).length, 2, "views");
});
