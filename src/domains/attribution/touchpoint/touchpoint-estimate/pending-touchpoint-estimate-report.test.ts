import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingTouchpointEstimateReport } from "./pending-touchpoint-estimate-report.js";
import { PendingTouchpointEstimate, newPendingTouchpointEstimate } from "./pending-touchpoint-estimate.js";

test("PendingTouchpointEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_219_378);
  const items: PendingTouchpointEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingTouchpointEstimate(`pending-touchpoint-estimate-${index}`, "sample"));
  }
  const report = buildPendingTouchpointEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
