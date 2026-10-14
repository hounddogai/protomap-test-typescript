import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingSenderQuotaReport } from "./rolling-sender-quota-report.js";
import { RollingSenderQuota, newRollingSenderQuota } from "./rolling-sender-quota.js";

test("RollingSenderQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_151_668);
  const items: RollingSenderQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingSenderQuota(`rolling-sender-quota-${index}`, "sample"));
  }
  const report = buildRollingSenderQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
