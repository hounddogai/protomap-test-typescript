import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTierCycleStore } from "./manual-tier-cycle-store.js";
import { newManualTierCycle } from "./manual-tier-cycle.js";

test("MemoryManualTierCycleStore finds what it saved", () => {
  const store = newMemoryManualTierCycleStore();
  const item = newManualTierCycle("code-449", "name-62");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
