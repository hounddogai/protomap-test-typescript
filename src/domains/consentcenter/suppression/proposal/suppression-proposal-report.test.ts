import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionProposalReport } from "./suppression-proposal-report.js";
import { SuppressionProposal, newSuppressionProposal } from "./suppression-proposal.js";

test("SuppressionProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_848_292);
  const items: SuppressionProposal[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSuppressionProposal(`suppression-proposal-${index}`, "sample"));
  }
  const report = buildSuppressionProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
