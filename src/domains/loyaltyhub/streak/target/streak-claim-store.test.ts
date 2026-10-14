import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakClaimStore } from "./streak-claim-store.js";
import { newStreakClaim } from "./streak-claim.js";

test("MemoryStreakClaimStore finds what it saved", () => {
  const store = newMemoryStreakClaimStore();
  const item = newStreakClaim("code-344", "name-981");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
