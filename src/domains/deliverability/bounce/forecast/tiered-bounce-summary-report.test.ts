import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBounceSummaryReport } from "./tiered-bounce-summary-report.js";
import { TieredBounceSummary, newTieredBounceSummary } from "./tiered-bounce-summary.js";

test("TieredBounceSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_138_874);
  const items: TieredBounceSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredBounceSummary(`tiered-bounce-summary-${index}`, "sample"));
  }
  const report = buildTieredBounceSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
