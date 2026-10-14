import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelThresholdReport } from "./level-threshold-report.js";
import { LevelThreshold, newLevelThreshold } from "./level-threshold.js";

test("LevelThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_309_843);
  const items: LevelThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLevelThreshold(`level-threshold-${index}`, "sample"));
  }
  const report = buildLevelThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
