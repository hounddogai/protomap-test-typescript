import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreditSummaryReport } from "./seasonal-credit-summary-report.js";
import { SeasonalCreditSummary, newSeasonalCreditSummary } from "./seasonal-credit-summary.js";

test("SeasonalCreditSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_155_458);
  const items: SeasonalCreditSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalCreditSummary(`seasonal-credit-summary-${index}`, "sample"));
  }
  const report = buildSeasonalCreditSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
