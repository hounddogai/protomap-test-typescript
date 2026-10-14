import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultJourneyProposalReport } from "./default-journey-proposal-report.js";
import { DefaultJourneyProposal, newDefaultJourneyProposal } from "./default-journey-proposal.js";

test("DefaultJourneyProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_803_425);
  const items: DefaultJourneyProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultJourneyProposal(`default-journey-proposal-${index}`, "sample"));
  }
  const report = buildDefaultJourneyProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
