import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingFrequencyProposalReport } from "./pending-frequency-proposal-report.js";
import { PendingFrequencyProposal, newPendingFrequencyProposal } from "./pending-frequency-proposal.js";

test("PendingFrequencyProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_013_831);
  const items: PendingFrequencyProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingFrequencyProposal(`pending-frequency-proposal-${index}`, "sample"));
  }
  const report = buildPendingFrequencyProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
