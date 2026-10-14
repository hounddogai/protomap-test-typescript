import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofProposalReport } from "./proof-proposal-report.js";
import { ProofProposal, newProofProposal } from "./proof-proposal.js";

test("ProofProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_827_070);
  const items: ProofProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newProofProposal(`proof-proposal-${index}`, "sample"));
  }
  const report = buildProofProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
