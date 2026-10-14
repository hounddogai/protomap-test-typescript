import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierCycleStore } from "./tier-cycle-store.js";
import { newTierCycle } from "./tier-cycle.js";

test("MemoryTierCycleStore finds what it saved", () => {
  const store = newMemoryTierCycleStore();
  const item = newTierCycle("code-243", "title-561");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
