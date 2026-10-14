import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedRewardSummaryReport } from "./capped-reward-summary-report.js";
import { CappedRewardSummary, newCappedRewardSummary } from "./capped-reward-summary.js";

test("CappedRewardSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_949_201);
  const items: CappedRewardSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedRewardSummary(`capped-reward-summary-${index}`, "sample"));
  }
  const report = buildCappedRewardSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
