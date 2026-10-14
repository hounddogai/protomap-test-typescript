import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictTouchpointBaselineReport } from "./strict-touchpoint-baseline-report.js";
import { StrictTouchpointBaseline, newStrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

test("StrictTouchpointBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_016_719);
  const items: StrictTouchpointBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictTouchpointBaseline(`strict-touchpoint-baseline-${index}`, "sample"));
  }
  const report = buildStrictTouchpointBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
