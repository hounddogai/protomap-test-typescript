import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRedemptionProposalReport } from "./weighted-redemption-proposal-report.js";
import { WeightedRedemptionProposal, newWeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

test("WeightedRedemptionProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_731_515);
  const items: WeightedRedemptionProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedRedemptionProposal(`weighted-redemption-proposal-${index}`, "sample"));
  }
  const report = buildWeightedRedemptionProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
