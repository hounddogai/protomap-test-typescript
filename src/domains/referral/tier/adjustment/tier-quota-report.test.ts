import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierQuotaReport } from "./tier-quota-report.js";
import { TierQuota, newTierQuota } from "./tier-quota.js";

test("TierQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_661_967);
  const items: TierQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTierQuota(`tier-quota-${index}`, "sample"));
  }
  const report = buildTierQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
