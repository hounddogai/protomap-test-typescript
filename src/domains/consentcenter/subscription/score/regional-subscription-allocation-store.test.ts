import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSubscriptionAllocationStore } from "./regional-subscription-allocation-store.js";
import { newRegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

test("MemoryRegionalSubscriptionAllocationStore finds what it saved", () => {
  const store = newMemoryRegionalSubscriptionAllocationStore();
  const item = newRegionalSubscriptionAllocation("code-533", "label-821");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
