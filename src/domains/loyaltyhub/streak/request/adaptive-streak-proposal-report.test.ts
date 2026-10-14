import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveStreakProposalReport } from "./adaptive-streak-proposal-report.js";
import { AdaptiveStreakProposal, newAdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

test("AdaptiveStreakProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_789_781);
  const items: AdaptiveStreakProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveStreakProposal(`adaptive-streak-proposal-${index}`, "sample"));
  }
  const report = buildAdaptiveStreakProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
