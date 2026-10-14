import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingWindowSummaryReport } from "./rolling-window-summary-report.js";
import { RollingWindowSummary, newRollingWindowSummary } from "./rolling-window-summary.js";

test("RollingWindowSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_236_859);
  const items: RollingWindowSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingWindowSummary(`rolling-window-summary-${index}`, "sample"));
  }
  const report = buildRollingWindowSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
