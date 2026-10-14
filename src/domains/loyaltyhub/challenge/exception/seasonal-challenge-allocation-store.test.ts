import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalChallengeAllocationStore } from "./seasonal-challenge-allocation-store.js";
import { newSeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

test("MemorySeasonalChallengeAllocationStore finds what it saved", () => {
  const store = newMemorySeasonalChallengeAllocationStore();
  const item = newSeasonalChallengeAllocation("code-81", "name-871");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
