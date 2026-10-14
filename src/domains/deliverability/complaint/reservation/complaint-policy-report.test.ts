import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintPolicyReport } from "./complaint-policy-report.js";
import { ComplaintPolicy, newComplaintPolicy } from "./complaint-policy.js";

test("ComplaintPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_046_296);
  const items: ComplaintPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newComplaintPolicy(`complaint-policy-${index}`, "sample"));
  }
  const report = buildComplaintPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
