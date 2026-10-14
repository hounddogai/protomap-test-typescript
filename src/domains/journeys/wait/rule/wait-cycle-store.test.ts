import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitCycleStore } from "./wait-cycle-store.js";
import { newWaitCycle } from "./wait-cycle.js";

test("MemoryWaitCycleStore finds what it saved", () => {
  const store = newMemoryWaitCycleStore();
  const item = newWaitCycle("code-394", "title-998");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
