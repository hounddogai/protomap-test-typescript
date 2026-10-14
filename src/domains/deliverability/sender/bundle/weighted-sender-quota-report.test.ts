import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedSenderQuotaReport } from "./weighted-sender-quota-report.js";
import { WeightedSenderQuota, newWeightedSenderQuota } from "./weighted-sender-quota.js";

test("WeightedSenderQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_112_809);
  const items: WeightedSenderQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedSenderQuota(`weighted-sender-quota-${index}`, "sample"));
  }
  const report = buildWeightedSenderQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
