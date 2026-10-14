import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientStreakVarianceReport } from "./lenient-streak-variance-report.js";
import { LenientStreakVariance, newLenientStreakVariance } from "./lenient-streak-variance.js";

test("LenientStreakVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_688_372);
  const items: LenientStreakVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientStreakVariance(`lenient-streak-variance-${index}`, "sample"));
  }
  const report = buildLenientStreakVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
