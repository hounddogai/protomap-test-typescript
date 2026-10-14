import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowProposalReport } from "./window-proposal-report.js";
import { WindowProposal, newWindowProposal } from "./window-proposal.js";

test("WindowProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_006_157);
  const items: WindowProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWindowProposal(`window-proposal-${index}`, "sample"));
  }
  const report = buildWindowProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
