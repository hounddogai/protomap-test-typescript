import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSubscriptionCycleStore } from "./default-subscription-cycle-store.js";
import { newDefaultSubscriptionCycle } from "./default-subscription-cycle.js";

test("MemoryDefaultSubscriptionCycleStore finds what it saved", () => {
  const store = newMemoryDefaultSubscriptionCycleStore();
  const item = newDefaultSubscriptionCycle("code-943", "label-591");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
