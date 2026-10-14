import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictMacroProposalReport } from "./strict-macro-proposal-report.js";
import { StrictMacroProposal, newStrictMacroProposal } from "./strict-macro-proposal.js";

test("StrictMacroProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_815_409);
  const items: StrictMacroProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictMacroProposal(`strict-macro-proposal-${index}`, "sample"));
  }
  const report = buildStrictMacroProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
