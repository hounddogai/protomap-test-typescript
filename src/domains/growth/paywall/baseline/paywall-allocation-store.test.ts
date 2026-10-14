import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallAllocationStore } from "./paywall-allocation-store.js";
import { newPaywallAllocation } from "./paywall-allocation.js";

test("MemoryPaywallAllocationStore finds what it saved", () => {
  const store = newMemoryPaywallAllocationStore();
  const item = newPaywallAllocation("code-776", "name-519");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
