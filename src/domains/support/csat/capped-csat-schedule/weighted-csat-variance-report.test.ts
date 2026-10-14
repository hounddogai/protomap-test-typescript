import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedCsatVarianceReport } from "./weighted-csat-variance-report.js";
import { WeightedCsatVariance, newWeightedCsatVariance } from "./weighted-csat-variance.js";

test("WeightedCsatVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_899_789);
  const items: WeightedCsatVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedCsatVariance(`weighted-csat-variance-${index}`, "sample"));
  }
  const report = buildWeightedCsatVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
