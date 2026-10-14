import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchRollupReport } from "./branch-rollup-report.js";
import { BranchRollup, newBranchRollup } from "./branch-rollup.js";

test("BranchRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_325_929);
  const items: BranchRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBranchRollup(`branch-rollup-${index}`, "sample"));
  }
  const report = buildBranchRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
