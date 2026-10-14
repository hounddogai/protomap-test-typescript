import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointVarianceReport } from "./touchpoint-variance-report.js";
import { TouchpointVariance, newTouchpointVariance } from "./touchpoint-variance.js";

test("TouchpointVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_225_024);
  const items: TouchpointVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTouchpointVariance(`touchpoint-variance-${index}`, "sample"));
  }
  const report = buildTouchpointVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
