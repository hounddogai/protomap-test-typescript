import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedTouchpointSummaryReport } from "./capped-touchpoint-summary-report.js";
import { CappedTouchpointSummary, newCappedTouchpointSummary } from "./capped-touchpoint-summary.js";

test("CappedTouchpointSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_718_060);
  const items: CappedTouchpointSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedTouchpointSummary(`capped-touchpoint-summary-${index}`, "sample"));
  }
  const report = buildCappedTouchpointSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
