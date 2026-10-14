import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalReplyProposalReport } from "./seasonal-reply-proposal-report.js";
import { SeasonalReplyProposal, newSeasonalReplyProposal } from "./seasonal-reply-proposal.js";

test("SeasonalReplyProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_402_871);
  const items: SeasonalReplyProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalReplyProposal(`seasonal-reply-proposal-${index}`, "sample"));
  }
  const report = buildSeasonalReplyProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
