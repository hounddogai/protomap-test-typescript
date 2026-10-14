import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredTierCycleReport } from "./tiered-tier-cycle-report.js";
import { TieredTierCycle, newTieredTierCycle } from "./tiered-tier-cycle.js";

test("TieredTierCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_312_252);
  const items: TieredTierCycle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredTierCycle(`tiered-tier-cycle-${index}`, "sample"));
  }
  const report = buildTieredTierCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
