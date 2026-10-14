import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalStreakProposalReport } from "./regional-streak-proposal-report.js";
import { RegionalStreakProposal, newRegionalStreakProposal } from "./regional-streak-proposal.js";

test("RegionalStreakProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_208_175);
  const items: RegionalStreakProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalStreakProposal(`regional-streak-proposal-${index}`, "sample"));
  }
  const report = buildRegionalStreakProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
