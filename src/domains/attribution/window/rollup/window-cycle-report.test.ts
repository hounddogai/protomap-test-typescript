import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowCycleReport } from "./window-cycle-report.js";
import { WindowCycle, newWindowCycle } from "./window-cycle.js";

test("WindowCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_041_657);
  const items: WindowCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWindowCycle(`window-cycle-${index}`, "sample"));
  }
  const report = buildWindowCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
