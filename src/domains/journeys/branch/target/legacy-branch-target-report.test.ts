import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyBranchTargetReport } from "./legacy-branch-target-report.js";
import { LegacyBranchTarget, newLegacyBranchTarget } from "./legacy-branch-target.js";

test("LegacyBranchTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_434_816);
  const items: LegacyBranchTarget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyBranchTarget(`legacy-branch-target-${index}`, "sample"));
  }
  const report = buildLegacyBranchTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
