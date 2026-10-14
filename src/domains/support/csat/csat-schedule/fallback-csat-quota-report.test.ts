import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackCsatQuotaReport } from "./fallback-csat-quota-report.js";
import { FallbackCsatQuota, newFallbackCsatQuota } from "./fallback-csat-quota.js";

test("FallbackCsatQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_398_183);
  const items: FallbackCsatQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackCsatQuota(`fallback-csat-quota-${index}`, "sample"));
  }
  const report = buildFallbackCsatQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
