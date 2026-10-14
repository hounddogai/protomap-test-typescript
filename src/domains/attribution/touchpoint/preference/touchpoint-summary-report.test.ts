import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointSummaryReport } from "./touchpoint-summary-report.js";
import { TouchpointSummary, newTouchpointSummary } from "./touchpoint-summary.js";

test("TouchpointSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_304_148);
  const items: TouchpointSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTouchpointSummary(`touchpoint-summary-${index}`, "sample"));
  }
  const report = buildTouchpointSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
