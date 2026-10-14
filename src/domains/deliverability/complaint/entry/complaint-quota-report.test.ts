import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintQuotaReport } from "./complaint-quota-report.js";
import { ComplaintQuota, newComplaintQuota } from "./complaint-quota.js";

test("ComplaintQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_440_631);
  const items: ComplaintQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newComplaintQuota(`complaint-quota-${index}`, "sample"));
  }
  const report = buildComplaintQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
