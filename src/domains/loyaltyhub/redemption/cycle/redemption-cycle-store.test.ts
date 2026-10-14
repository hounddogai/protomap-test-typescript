import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionCycleStore } from "./redemption-cycle-store.js";
import { newRedemptionCycle } from "./redemption-cycle.js";

test("MemoryRedemptionCycleStore finds what it saved", () => {
  const store = newMemoryRedemptionCycleStore();
  const item = newRedemptionCycle("code-153", "name-315");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
