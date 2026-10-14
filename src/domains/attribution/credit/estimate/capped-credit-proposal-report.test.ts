import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedCreditProposalReport } from "./capped-credit-proposal-report.js";
import { CappedCreditProposal, newCappedCreditProposal } from "./capped-credit-proposal.js";

test("CappedCreditProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_259_561);
  const items: CappedCreditProposal[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedCreditProposal(`capped-credit-proposal-${index}`, "sample"));
  }
  const report = buildCappedCreditProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
