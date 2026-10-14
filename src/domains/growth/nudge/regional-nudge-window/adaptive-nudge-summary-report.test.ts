import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveNudgeSummaryReport } from "./adaptive-nudge-summary-report.js";
import { AdaptiveNudgeSummary, newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

test("AdaptiveNudgeSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_309_441);
  const items: AdaptiveNudgeSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveNudgeSummary(`adaptive-nudge-summary-${index}`, "sample"));
  }
  const report = buildAdaptiveNudgeSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
