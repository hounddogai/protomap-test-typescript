import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedDoubleOptInBaselineReport } from "./weighted-double-opt-in-baseline-report.js";
import { WeightedDoubleOptInBaseline, newWeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

test("WeightedDoubleOptInBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_394_903);
  const items: WeightedDoubleOptInBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedDoubleOptInBaseline(`weighted-double-opt-in-baseline-${index}`, "sample"));
  }
  const report = buildWeightedDoubleOptInBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
