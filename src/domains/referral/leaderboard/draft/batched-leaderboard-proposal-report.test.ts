import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedLeaderboardProposalReport } from "./batched-leaderboard-proposal-report.js";
import { BatchedLeaderboardProposal, newBatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

test("BatchedLeaderboardProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_674_506);
  const items: BatchedLeaderboardProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedLeaderboardProposal(`batched-leaderboard-proposal-${index}`, "sample"));
  }
  const report = buildBatchedLeaderboardProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
