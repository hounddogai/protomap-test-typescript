import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingEnrollmentProposalReport } from "./pending-enrollment-proposal-report.js";
import { PendingEnrollmentProposal, newPendingEnrollmentProposal } from "./pending-enrollment-proposal.js";

test("PendingEnrollmentProposalReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_095_066);
  const items: PendingEnrollmentProposal[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingEnrollmentProposal(`pending-enrollment-proposal-${index}`, "sample"));
  }
  const report = buildPendingEnrollmentProposalReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
