import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakSummaryReport } from "./streak-summary-report.js";
import { StreakSummary, newStreakSummary } from "./streak-summary.js";

test("StreakSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_378_781);
  const items: StreakSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStreakSummary(`streak-summary-${index}`, "sample"));
  }
  const report = buildStreakSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
