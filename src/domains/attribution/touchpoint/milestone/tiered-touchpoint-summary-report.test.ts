import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredTouchpointSummaryReport } from "./tiered-touchpoint-summary-report.js";
import { TieredTouchpointSummary, newTieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

test("TieredTouchpointSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_048_771);
  const items: TieredTouchpointSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredTouchpointSummary(`tiered-touchpoint-summary-${index}`, "sample"));
  }
  const report = buildTieredTouchpointSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
