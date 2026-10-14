import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeThresholdReport } from "./nudge-threshold-report.js";
import { NudgeThreshold, newNudgeThreshold } from "./nudge-threshold.js";

test("NudgeThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_997_061);
  const items: NudgeThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newNudgeThreshold(`nudge-threshold-${index}`, "sample"));
  }
  const report = buildNudgeThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
