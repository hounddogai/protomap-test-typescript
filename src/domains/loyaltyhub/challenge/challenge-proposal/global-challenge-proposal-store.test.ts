import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalChallengeProposalStore } from "./global-challenge-proposal-store.js";
import { newGlobalChallengeProposal } from "./global-challenge-proposal.js";

test("MemoryGlobalChallengeProposalStore finds what it saved", () => {
  const store = newMemoryGlobalChallengeProposalStore();
  const item = newGlobalChallengeProposal("code-215", "name-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
