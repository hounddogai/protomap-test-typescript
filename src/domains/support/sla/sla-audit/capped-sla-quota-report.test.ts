import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedSlaQuotaReport } from "./capped-sla-quota-report.js";
import { CappedSlaQuota, newCappedSlaQuota } from "./capped-sla-quota.js";

test("CappedSlaQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_815_909);
  const items: CappedSlaQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedSlaQuota(`capped-sla-quota-${index}`, "sample"));
  }
  const report = buildCappedSlaQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
