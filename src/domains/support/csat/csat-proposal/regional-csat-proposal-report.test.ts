import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalCsatProposalReport } from "./regional-csat-proposal-report.js";
import { RegionalCsatProposal, newRegionalCsatProposal } from "./regional-csat-proposal.js";

test("RegionalCsatProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_892_591);
  const items: RegionalCsatProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalCsatProposal(`regional-csat-proposal-${index}`, "sample"));
  }
  const report = buildRegionalCsatProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
