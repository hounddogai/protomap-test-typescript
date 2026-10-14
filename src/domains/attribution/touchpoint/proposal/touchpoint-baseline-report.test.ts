import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointBaselineReport } from "./touchpoint-baseline-report.js";
import { TouchpointBaseline, newTouchpointBaseline } from "./touchpoint-baseline.js";

test("TouchpointBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_857_557);
  const items: TouchpointBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTouchpointBaseline(`touchpoint-baseline-${index}`, "sample"));
  }
  const report = buildTouchpointBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
