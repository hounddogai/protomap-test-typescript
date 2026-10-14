import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientOptOutCycleStore } from "./lenient-opt-out-cycle-store.js";
import { newLenientOptOutCycle } from "./lenient-opt-out-cycle.js";

test("MemoryLenientOptOutCycleStore finds what it saved", () => {
  const store = newMemoryLenientOptOutCycleStore();
  const item = newLenientOptOutCycle("code-126", "name-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
