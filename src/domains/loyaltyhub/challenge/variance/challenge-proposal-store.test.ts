import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeProposalStore } from "./challenge-proposal-store.js";
import { newChallengeProposal } from "./challenge-proposal.js";

test("MemoryChallengeProposalStore finds what it saved", () => {
  const store = newMemoryChallengeProposalStore();
  const item = newChallengeProposal("code-246", "label-258");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
