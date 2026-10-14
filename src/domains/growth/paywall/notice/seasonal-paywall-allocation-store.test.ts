import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPaywallAllocationStore } from "./seasonal-paywall-allocation-store.js";
import { newSeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

test("MemorySeasonalPaywallAllocationStore finds what it saved", () => {
  const store = newMemorySeasonalPaywallAllocationStore();
  const item = newSeasonalPaywallAllocation("code-718", "label-276");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
