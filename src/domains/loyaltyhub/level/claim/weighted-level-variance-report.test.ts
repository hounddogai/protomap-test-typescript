import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedLevelVarianceReport } from "./weighted-level-variance-report.js";
import { WeightedLevelVariance, newWeightedLevelVariance } from "./weighted-level-variance.js";

test("WeightedLevelVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_670_502);
  const items: WeightedLevelVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedLevelVariance(`weighted-level-variance-${index}`, "sample"));
  }
  const report = buildWeightedLevelVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
