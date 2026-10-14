import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeAllocationView, toCreativeAllocationViews } from "./creative-allocation-view.js";
import { newCreativeAllocation } from "./creative-allocation.js";

test("CreativeAllocationView shows the status in capitals", () => {
  const item = newCreativeAllocation("code-999", "name-354");
  const view = toCreativeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeAllocationViews([item, item]).length, 2, "views");
});
