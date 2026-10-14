import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardProposalView, toLeaderboardProposalViews } from "./leaderboard-proposal-view.js";
import { newLeaderboardProposal } from "./leaderboard-proposal.js";

test("LeaderboardProposalView shows the status in capitals", () => {
  const item = newLeaderboardProposal("code-696", "label-834");
  const view = toLeaderboardProposalView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardProposalViews([item, item]).length, 2, "views");
});
