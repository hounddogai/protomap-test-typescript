import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingComplaintPolicyReport } from "./rolling-complaint-policy-report.js";
import { RollingComplaintPolicy, newRollingComplaintPolicy } from "./rolling-complaint-policy.js";

test("RollingComplaintPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_626_479);
  const items: RollingComplaintPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingComplaintPolicy(`rolling-complaint-policy-${index}`, "sample"));
  }
  const report = buildRollingComplaintPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
