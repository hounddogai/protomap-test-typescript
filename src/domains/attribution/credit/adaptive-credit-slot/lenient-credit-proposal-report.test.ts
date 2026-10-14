import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCreditProposalReport } from "./lenient-credit-proposal-report.js";
import { LenientCreditProposal, newLenientCreditProposal } from "./lenient-credit-proposal.js";

test("LenientCreditProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_186_421);
  const items: LenientCreditProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientCreditProposal(`lenient-credit-proposal-${index}`, "sample"));
  }
  const report = buildLenientCreditProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
