import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeClaimStore } from "./challenge-claim-store.js";
import { newChallengeClaim } from "./challenge-claim.js";

test("MemoryChallengeClaimStore finds what it saved", () => {
  const store = newMemoryChallengeClaimStore();
  const item = newChallengeClaim("code-356", "label-513");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
