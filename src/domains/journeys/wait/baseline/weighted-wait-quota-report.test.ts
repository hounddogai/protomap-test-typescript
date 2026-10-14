import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedWaitQuotaReport } from "./weighted-wait-quota-report.js";
import { WeightedWaitQuota, newWeightedWaitQuota } from "./weighted-wait-quota.js";

test("WeightedWaitQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_431_461);
  const items: WeightedWaitQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedWaitQuota(`weighted-wait-quota-${index}`, "sample"));
  }
  const report = buildWeightedWaitQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
