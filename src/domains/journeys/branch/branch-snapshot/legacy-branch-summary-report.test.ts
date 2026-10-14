import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyBranchSummaryReport } from "./legacy-branch-summary-report.js";
import { LegacyBranchSummary, newLegacyBranchSummary } from "./legacy-branch-summary.js";

test("LegacyBranchSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_195_418);
  const items: LegacyBranchSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyBranchSummary(`legacy-branch-summary-${index}`, "sample"));
  }
  const report = buildLegacyBranchSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
