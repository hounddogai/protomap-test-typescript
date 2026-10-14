import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightQuotaReport } from "./insight-quota-report.js";
import { InsightQuota, newInsightQuota } from "./insight-quota.js";

test("InsightQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_059_909);
  const items: InsightQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newInsightQuota(`insight-quota-${index}`, "sample"));
  }
  const report = buildInsightQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
