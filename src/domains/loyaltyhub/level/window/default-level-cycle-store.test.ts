import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultLevelCycleStore } from "./default-level-cycle-store.js";
import { newDefaultLevelCycle } from "./default-level-cycle.js";

test("MemoryDefaultLevelCycleStore finds what it saved", () => {
  const store = newMemoryDefaultLevelCycleStore();
  const item = newDefaultLevelCycle("code-564", "name-630");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
