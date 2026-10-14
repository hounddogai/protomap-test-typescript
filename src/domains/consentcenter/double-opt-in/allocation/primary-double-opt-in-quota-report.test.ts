import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryDoubleOptInQuotaReport } from "./primary-double-opt-in-quota-report.js";
import { PrimaryDoubleOptInQuota, newPrimaryDoubleOptInQuota } from "./primary-double-opt-in-quota.js";

test("PrimaryDoubleOptInQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_620_862);
  const items: PrimaryDoubleOptInQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryDoubleOptInQuota(`primary-double-opt-in-quota-${index}`, "sample"));
  }
  const report = buildPrimaryDoubleOptInQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
