import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelProposalReport } from "./funnel-proposal-report.js";
import { FunnelProposal, newFunnelProposal } from "./funnel-proposal.js";

test("FunnelProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_500_072);
  const items: FunnelProposal[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFunnelProposal(`funnel-proposal-${index}`, "sample"));
  }
  const report = buildFunnelProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
