import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedLeaderboardProposalStore } from "./batched-leaderboard-proposal-store.js";
import { newBatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

test("MemoryBatchedLeaderboardProposalStore finds what it saved", () => {
  const store = newMemoryBatchedLeaderboardProposalStore();
  const item = newBatchedLeaderboardProposal("code-477", "label-734");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
