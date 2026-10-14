import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationCycleStore } from "./reputation-cycle-store.js";
import { newReputationCycle } from "./reputation-cycle.js";

test("MemoryReputationCycleStore finds what it saved", () => {
  const store = newMemoryReputationCycleStore();
  const item = newReputationCycle("code-37", "title-724");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
