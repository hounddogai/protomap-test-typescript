import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedLeaderboardProposalView,
  toBatchedLeaderboardProposalViews,
} from "./batched-leaderboard-proposal-view.js";
import { newBatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

test("BatchedLeaderboardProposalView shows the status in capitals", () => {
  const item = newBatchedLeaderboardProposal("code-477", "label-734");
  const view = toBatchedLeaderboardProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedLeaderboardProposalViews([item, item]).length, 2, "views");
});
