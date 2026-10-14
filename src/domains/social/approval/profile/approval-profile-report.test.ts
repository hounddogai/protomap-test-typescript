import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalProfileReport } from "./approval-profile-report.js";
import { ApprovalProfile, newApprovalProfile } from "./approval-profile.js";

test("ApprovalProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_526_472);
  const items: ApprovalProfile[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newApprovalProfile(`approval-profile-${index}`, "sample"));
  }
  const report = buildApprovalProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
