import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientBranchCycleReport } from "./lenient-branch-cycle-report.js";
import { LenientBranchCycle, newLenientBranchCycle } from "./lenient-branch-cycle.js";

test("LenientBranchCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_948_197);
  const items: LenientBranchCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientBranchCycle(`lenient-branch-cycle-${index}`, "sample"));
  }
  const report = buildLenientBranchCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
