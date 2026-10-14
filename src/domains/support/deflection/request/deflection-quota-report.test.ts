import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionQuotaReport } from "./deflection-quota-report.js";
import { DeflectionQuota, newDeflectionQuota } from "./deflection-quota.js";

test("DeflectionQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_740_596);
  const items: DeflectionQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDeflectionQuota(`deflection-quota-${index}`, "sample"));
  }
  const report = buildDeflectionQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
