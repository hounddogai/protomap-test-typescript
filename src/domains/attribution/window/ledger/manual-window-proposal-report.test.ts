import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualWindowProposalReport } from "./manual-window-proposal-report.js";
import { ManualWindowProposal, newManualWindowProposal } from "./manual-window-proposal.js";

test("ManualWindowProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_082_236);
  const items: ManualWindowProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualWindowProposal(`manual-window-proposal-${index}`, "sample"));
  }
  const report = buildManualWindowProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
