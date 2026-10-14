import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardCycleStore } from "./reward-cycle-store.js";
import { newRewardCycle } from "./reward-cycle.js";

test("MemoryRewardCycleStore finds what it saved", () => {
  const store = newMemoryRewardCycleStore();
  const item = newRewardCycle("code-467", "title-723");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
