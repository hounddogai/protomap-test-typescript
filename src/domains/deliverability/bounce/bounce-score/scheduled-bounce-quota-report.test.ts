import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledBounceQuotaReport } from "./scheduled-bounce-quota-report.js";
import { ScheduledBounceQuota, newScheduledBounceQuota } from "./scheduled-bounce-quota.js";

test("ScheduledBounceQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_963_243);
  const items: ScheduledBounceQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledBounceQuota(`scheduled-bounce-quota-${index}`, "sample"));
  }
  const report = buildScheduledBounceQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
