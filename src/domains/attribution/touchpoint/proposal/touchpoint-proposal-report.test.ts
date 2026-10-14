import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointProposalReport } from "./touchpoint-proposal-report.js";
import { TouchpointProposal, newTouchpointProposal } from "./touchpoint-proposal.js";

test("TouchpointProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_365_955);
  const items: TouchpointProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTouchpointProposal(`touchpoint-proposal-${index}`, "sample"));
  }
  const report = buildTouchpointProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
