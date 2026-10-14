import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteProposalReport } from "./invite-proposal-report.js";
import { InviteProposal, newInviteProposal } from "./invite-proposal.js";

test("InviteProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_604_837);
  const items: InviteProposal[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInviteProposal(`invite-proposal-${index}`, "sample"));
  }
  const report = buildInviteProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
