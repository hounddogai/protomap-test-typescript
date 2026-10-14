import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPathQuotaReport } from "./weighted-path-quota-report.js";
import { WeightedPathQuota, newWeightedPathQuota } from "./weighted-path-quota.js";

test("WeightedPathQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_652_474);
  const items: WeightedPathQuota[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedPathQuota(`weighted-path-quota-${index}`, "sample"));
  }
  const report = buildWeightedPathQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
