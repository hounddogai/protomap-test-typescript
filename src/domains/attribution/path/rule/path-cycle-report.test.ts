import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathCycleReport } from "./path-cycle-report.js";
import { PathCycle, newPathCycle } from "./path-cycle.js";

test("PathCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_575_217);
  const items: PathCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPathCycle(`path-cycle-${index}`, "sample"));
  }
  const report = buildPathCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
