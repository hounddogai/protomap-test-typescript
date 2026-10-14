import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakQuotaReport } from "./streak-quota-report.js";
import { StreakQuota, newStreakQuota } from "./streak-quota.js";

test("StreakQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_376_592);
  const items: StreakQuota[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStreakQuota(`streak-quota-${index}`, "sample"));
  }
  const report = buildStreakQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
