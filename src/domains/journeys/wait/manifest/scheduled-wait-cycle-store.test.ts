import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWaitCycleStore } from "./scheduled-wait-cycle-store.js";
import { newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

test("MemoryScheduledWaitCycleStore finds what it saved", () => {
  const store = newMemoryScheduledWaitCycleStore();
  const item = newScheduledWaitCycle("code-667", "title-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
