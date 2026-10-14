import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWaitCycleReport } from "./scheduled-wait-cycle-report.js";
import { ScheduledWaitCycle, newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

test("ScheduledWaitCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_660_082);
  const items: ScheduledWaitCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledWaitCycle(`scheduled-wait-cycle-${index}`, "sample"));
  }
  const report = buildScheduledWaitCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
