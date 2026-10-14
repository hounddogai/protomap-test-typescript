import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeProposalReport } from "./creative-proposal-report.js";
import { CreativeProposal, newCreativeProposal } from "./creative-proposal.js";

test("CreativeProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_761_427);
  const items: CreativeProposal[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCreativeProposal(`creative-proposal-${index}`, "sample"));
  }
  const report = buildCreativeProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
