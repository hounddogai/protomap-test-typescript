import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeAllocationStore } from "./challenge-allocation-store.js";
import { newChallengeAllocation } from "./challenge-allocation.js";

test("MemoryChallengeAllocationStore finds what it saved", () => {
  const store = newMemoryChallengeAllocationStore();
  const item = newChallengeAllocation("code-294", "title-766");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
