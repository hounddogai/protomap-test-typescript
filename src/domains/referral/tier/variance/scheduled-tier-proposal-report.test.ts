import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledTierProposalReport } from "./scheduled-tier-proposal-report.js";
import { ScheduledTierProposal, newScheduledTierProposal } from "./scheduled-tier-proposal.js";

test("ScheduledTierProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_004_848);
  const items: ScheduledTierProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledTierProposal(`scheduled-tier-proposal-${index}`, "sample"));
  }
  const report = buildScheduledTierProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
