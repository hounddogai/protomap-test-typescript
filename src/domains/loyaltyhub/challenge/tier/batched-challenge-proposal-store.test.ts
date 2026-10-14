import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedChallengeProposalStore } from "./batched-challenge-proposal-store.js";
import { newBatchedChallengeProposal } from "./batched-challenge-proposal.js";

test("MemoryBatchedChallengeProposalStore finds what it saved", () => {
  const store = newMemoryBatchedChallengeProposalStore();
  const item = newBatchedChallengeProposal("code-574", "label-868");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
