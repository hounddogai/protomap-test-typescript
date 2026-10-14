import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardProposalStore } from "./leaderboard-proposal-store.js";
import { newLeaderboardProposal } from "./leaderboard-proposal.js";

test("MemoryLeaderboardProposalStore finds what it saved", () => {
  const store = newMemoryLeaderboardProposalStore();
  const item = newLeaderboardProposal("code-696", "label-834");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
