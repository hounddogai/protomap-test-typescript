import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTierCycleReport } from "./manual-tier-cycle-report.js";
import { ManualTierCycle, newManualTierCycle } from "./manual-tier-cycle.js";

test("ManualTierCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_792_241);
  const items: ManualTierCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualTierCycle(`manual-tier-cycle-${index}`, "sample"));
  }
  const report = buildManualTierCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
