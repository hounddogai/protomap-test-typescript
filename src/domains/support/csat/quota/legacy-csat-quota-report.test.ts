import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyCsatQuotaReport } from "./legacy-csat-quota-report.js";
import { LegacyCsatQuota, newLegacyCsatQuota } from "./legacy-csat-quota.js";

test("LegacyCsatQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_268_176);
  const items: LegacyCsatQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyCsatQuota(`legacy-csat-quota-${index}`, "sample"));
  }
  const report = buildLegacyCsatQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
