import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionCycleStore } from "./suppression-cycle-store.js";
import { newSuppressionCycle } from "./suppression-cycle.js";

test("MemorySuppressionCycleStore finds what it saved", () => {
  const store = newMemorySuppressionCycleStore();
  const item = newSuppressionCycle("code-189", "name-593");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
