import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardProposalReport } from "./reward-proposal-report.js";
import { RewardProposal, newRewardProposal } from "./reward-proposal.js";

test("RewardProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_898_186);
  const items: RewardProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardProposal(`reward-proposal-${index}`, "sample"));
  }
  const report = buildRewardProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
