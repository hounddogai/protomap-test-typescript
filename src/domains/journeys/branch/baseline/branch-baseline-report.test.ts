import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchBaselineReport } from "./branch-baseline-report.js";
import { BranchBaseline, newBranchBaseline } from "./branch-baseline.js";

test("BranchBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_055_933);
  const items: BranchBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBranchBaseline(`branch-baseline-${index}`, "sample"));
  }
  const report = buildBranchBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
