import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupCycleStore } from "./warmup-cycle-store.js";
import { newWarmupCycle } from "./warmup-cycle.js";

test("MemoryWarmupCycleStore finds what it saved", () => {
  const store = newMemoryWarmupCycleStore();
  const item = newWarmupCycle("code-644", "label-695");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
