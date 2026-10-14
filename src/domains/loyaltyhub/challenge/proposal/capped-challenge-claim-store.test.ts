import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedChallengeClaimStore } from "./capped-challenge-claim-store.js";
import { newCappedChallengeClaim } from "./capped-challenge-claim.js";

test("MemoryCappedChallengeClaimStore finds what it saved", () => {
  const store = newMemoryCappedChallengeClaimStore();
  const item = newCappedChallengeClaim("code-74", "name-57");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
