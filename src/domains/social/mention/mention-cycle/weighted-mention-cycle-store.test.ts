import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedMentionCycleStore } from "./weighted-mention-cycle-store.js";
import { newWeightedMentionCycle } from "./weighted-mention-cycle.js";

test("MemoryWeightedMentionCycleStore finds what it saved", () => {
  const store = newMemoryWeightedMentionCycleStore();
  const item = newWeightedMentionCycle("code-232", "label-449");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
