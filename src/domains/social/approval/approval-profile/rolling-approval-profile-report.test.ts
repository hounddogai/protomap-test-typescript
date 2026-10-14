import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingApprovalProfileReport } from "./rolling-approval-profile-report.js";
import { RollingApprovalProfile, newRollingApprovalProfile } from "./rolling-approval-profile.js";

test("RollingApprovalProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_054_707);
  const items: RollingApprovalProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingApprovalProfile(`rolling-approval-profile-${index}`, "sample"));
  }
  const report = buildRollingApprovalProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
