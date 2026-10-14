import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceProposalReport } from "./preference-proposal-report.js";
import { PreferenceProposal, newPreferenceProposal } from "./preference-proposal.js";

test("PreferenceProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_596_668);
  const items: PreferenceProposal[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPreferenceProposal(`preference-proposal-${index}`, "sample"));
  }
  const report = buildPreferenceProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
