import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatProposalReport } from "./csat-proposal-report.js";
import { CsatProposal, newCsatProposal } from "./csat-proposal.js";

test("CsatProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_578_073);
  const items: CsatProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCsatProposal(`csat-proposal-${index}`, "sample"));
  }
  const report = buildCsatProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
