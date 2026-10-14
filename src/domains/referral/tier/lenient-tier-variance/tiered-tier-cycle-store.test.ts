import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTierCycleStore } from "./tiered-tier-cycle-store.js";
import { newTieredTierCycle } from "./tiered-tier-cycle.js";

test("MemoryTieredTierCycleStore finds what it saved", () => {
  const store = newMemoryTieredTierCycleStore();
  const item = newTieredTierCycle("code-861", "label-392");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
