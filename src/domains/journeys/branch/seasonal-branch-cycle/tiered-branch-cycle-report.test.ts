import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBranchCycleReport } from "./tiered-branch-cycle-report.js";
import { TieredBranchCycle, newTieredBranchCycle } from "./tiered-branch-cycle.js";

test("TieredBranchCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_612_437);
  const items: TieredBranchCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredBranchCycle(`tiered-branch-cycle-${index}`, "sample"));
  }
  const report = buildTieredBranchCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
