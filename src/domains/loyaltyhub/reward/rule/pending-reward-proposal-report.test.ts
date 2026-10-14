import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingRewardProposalReport } from "./pending-reward-proposal-report.js";
import { PendingRewardProposal, newPendingRewardProposal } from "./pending-reward-proposal.js";

test("PendingRewardProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_806_473);
  const items: PendingRewardProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingRewardProposal(`pending-reward-proposal-${index}`, "sample"));
  }
  const report = buildPendingRewardProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
