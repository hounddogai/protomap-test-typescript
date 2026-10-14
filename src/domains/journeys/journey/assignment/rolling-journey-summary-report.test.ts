import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingJourneySummaryReport } from "./rolling-journey-summary-report.js";
import { RollingJourneySummary, newRollingJourneySummary } from "./rolling-journey-summary.js";

test("RollingJourneySummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_648_765);
  const items: RollingJourneySummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingJourneySummary(`rolling-journey-summary-${index}`, "sample"));
  }
  const report = buildRollingJourneySummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
