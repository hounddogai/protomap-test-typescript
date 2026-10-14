import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictWaitCycleStore } from "./strict-wait-cycle-store.js";
import { newStrictWaitCycle } from "./strict-wait-cycle.js";

test("MemoryStrictWaitCycleStore finds what it saved", () => {
  const store = newMemoryStrictWaitCycleStore();
  const item = newStrictWaitCycle("code-186", "label-528");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
