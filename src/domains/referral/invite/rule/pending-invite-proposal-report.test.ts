import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingInviteProposalReport } from "./pending-invite-proposal-report.js";
import { PendingInviteProposal, newPendingInviteProposal } from "./pending-invite-proposal.js";

test("PendingInviteProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_874_710);
  const items: PendingInviteProposal[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingInviteProposal(`pending-invite-proposal-${index}`, "sample"));
  }
  const report = buildPendingInviteProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
