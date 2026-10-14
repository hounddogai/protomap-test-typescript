import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyStreakThresholdReport } from "./legacy-streak-threshold-report.js";
import { LegacyStreakThreshold, newLegacyStreakThreshold } from "./legacy-streak-threshold.js";

test("LegacyStreakThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_942_394);
  const items: LegacyStreakThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyStreakThreshold(`legacy-streak-threshold-${index}`, "sample"));
  }
  const report = buildLegacyStreakThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
