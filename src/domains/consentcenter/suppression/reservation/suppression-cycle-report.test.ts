import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionCycleReport } from "./suppression-cycle-report.js";
import { SuppressionCycle, newSuppressionCycle } from "./suppression-cycle.js";

test("SuppressionCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_319_894);
  const items: SuppressionCycle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSuppressionCycle(`suppression-cycle-${index}`, "sample"));
  }
  const report = buildSuppressionCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
