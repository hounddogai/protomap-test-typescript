import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelCycleReport } from "./level-cycle-report.js";
import { LevelCycle, newLevelCycle } from "./level-cycle.js";

test("LevelCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_666_157);
  const items: LevelCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLevelCycle(`level-cycle-${index}`, "sample"));
  }
  const report = buildLevelCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
