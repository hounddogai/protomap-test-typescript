import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPreferenceBaselineReport } from "./weighted-preference-baseline-report.js";
import { WeightedPreferenceBaseline, newWeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

test("WeightedPreferenceBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_801_807);
  const items: WeightedPreferenceBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedPreferenceBaseline(`weighted-preference-baseline-${index}`, "sample"));
  }
  const report = buildWeightedPreferenceBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
