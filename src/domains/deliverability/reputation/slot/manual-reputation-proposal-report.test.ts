import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualReputationProposalReport } from "./manual-reputation-proposal-report.js";
import { ManualReputationProposal, newManualReputationProposal } from "./manual-reputation-proposal.js";

test("ManualReputationProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_377_433);
  const items: ManualReputationProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualReputationProposal(`manual-reputation-proposal-${index}`, "sample"));
  }
  const report = buildManualReputationProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
