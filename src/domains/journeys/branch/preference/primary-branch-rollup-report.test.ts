import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBranchRollupReport } from "./primary-branch-rollup-report.js";
import { PrimaryBranchRollup, newPrimaryBranchRollup } from "./primary-branch-rollup.js";

test("PrimaryBranchRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_032_348);
  const items: PrimaryBranchRollup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryBranchRollup(`primary-branch-rollup-${index}`, "sample"));
  }
  const report = buildPrimaryBranchRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
