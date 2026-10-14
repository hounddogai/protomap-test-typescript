import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFlightProposalReport } from "./global-flight-proposal-report.js";
import { GlobalFlightProposal, newGlobalFlightProposal } from "./global-flight-proposal.js";

test("GlobalFlightProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_079_657);
  const items: GlobalFlightProposal[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalFlightProposal(`global-flight-proposal-${index}`, "sample"));
  }
  const report = buildGlobalFlightProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
