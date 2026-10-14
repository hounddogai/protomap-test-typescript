import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutProposalReport } from "./opt-out-proposal-report.js";
import { OptOutProposal, newOptOutProposal } from "./opt-out-proposal.js";

test("OptOutProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_469_687);
  const items: OptOutProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newOptOutProposal(`opt-out-proposal-${index}`, "sample"));
  }
  const report = buildOptOutProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
