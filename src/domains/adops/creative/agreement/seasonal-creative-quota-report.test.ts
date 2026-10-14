import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreativeQuotaReport } from "./seasonal-creative-quota-report.js";
import { SeasonalCreativeQuota, newSeasonalCreativeQuota } from "./seasonal-creative-quota.js";

test("SeasonalCreativeQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_024_646);
  const items: SeasonalCreativeQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalCreativeQuota(`seasonal-creative-quota-${index}`, "sample"));
  }
  const report = buildSeasonalCreativeQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
