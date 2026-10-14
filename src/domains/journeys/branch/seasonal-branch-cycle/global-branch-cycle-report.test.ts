import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalBranchCycleReport } from "./global-branch-cycle-report.js";
import { GlobalBranchCycle, newGlobalBranchCycle } from "./global-branch-cycle.js";

test("GlobalBranchCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_771_175);
  const items: GlobalBranchCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalBranchCycle(`global-branch-cycle-${index}`, "sample"));
  }
  const report = buildGlobalBranchCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
