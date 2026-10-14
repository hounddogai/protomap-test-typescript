import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionProposalReport } from "./redemption-proposal-report.js";
import { RedemptionProposal, newRedemptionProposal } from "./redemption-proposal.js";

test("RedemptionProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_170_422);
  const items: RedemptionProposal[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRedemptionProposal(`redemption-proposal-${index}`, "sample"));
  }
  const report = buildRedemptionProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
