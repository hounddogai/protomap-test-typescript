import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledSubscriptionCycleStore } from "./scheduled-subscription-cycle-store.js";
import { newScheduledSubscriptionCycle } from "./scheduled-subscription-cycle.js";

test("MemoryScheduledSubscriptionCycleStore finds what it saved", () => {
  const store = newMemoryScheduledSubscriptionCycleStore();
  const item = newScheduledSubscriptionCycle("code-584", "name-635");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
