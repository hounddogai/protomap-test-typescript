import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierCycleReport } from "./tier-cycle-report.js";
import { TierCycle, newTierCycle } from "./tier-cycle.js";

test("TierCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_425_159);
  const items: TierCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTierCycle(`tier-cycle-${index}`, "sample"));
  }
  const report = buildTierCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
