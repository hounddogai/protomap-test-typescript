import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingApprovalDigestReport } from "./rolling-approval-digest-report.js";
import { RollingApprovalDigest, newRollingApprovalDigest } from "./rolling-approval-digest.js";

test("RollingApprovalDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_184_115);
  const items: RollingApprovalDigest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingApprovalDigest(`rolling-approval-digest-${index}`, "sample"));
  }
  const report = buildRollingApprovalDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
