import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRewardCycleReport } from "./tiered-reward-cycle-report.js";
import { TieredRewardCycle, newTieredRewardCycle } from "./tiered-reward-cycle.js";

test("TieredRewardCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_033_035);
  const items: TieredRewardCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredRewardCycle(`tiered-reward-cycle-${index}`, "sample"));
  }
  const report = buildTieredRewardCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
