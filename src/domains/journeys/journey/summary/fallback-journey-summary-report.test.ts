import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackJourneySummaryReport } from "./fallback-journey-summary-report.js";
import { FallbackJourneySummary, newFallbackJourneySummary } from "./fallback-journey-summary.js";

test("FallbackJourneySummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_943_575);
  const items: FallbackJourneySummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackJourneySummary(`fallback-journey-summary-${index}`, "sample"));
  }
  const report = buildFallbackJourneySummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
