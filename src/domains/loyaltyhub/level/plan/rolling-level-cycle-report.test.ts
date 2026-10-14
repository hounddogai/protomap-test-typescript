import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingLevelCycleReport } from "./rolling-level-cycle-report.js";
import { RollingLevelCycle, newRollingLevelCycle } from "./rolling-level-cycle.js";

test("RollingLevelCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_117_895);
  const items: RollingLevelCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingLevelCycle(`rolling-level-cycle-${index}`, "sample"));
  }
  const report = buildRollingLevelCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
