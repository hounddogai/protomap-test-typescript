import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultLevelCycleReport } from "./default-level-cycle-report.js";
import { DefaultLevelCycle, newDefaultLevelCycle } from "./default-level-cycle.js";

test("DefaultLevelCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_468_131);
  const items: DefaultLevelCycle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultLevelCycle(`default-level-cycle-${index}`, "sample"));
  }
  const report = buildDefaultLevelCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
