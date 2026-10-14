import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedBouncePreferenceReport } from "./weighted-bounce-preference-report.js";
import { WeightedBouncePreference, newWeightedBouncePreference } from "./weighted-bounce-preference.js";

test("WeightedBouncePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_333_881);
  const items: WeightedBouncePreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedBouncePreference(`weighted-bounce-preference-${index}`, "sample"));
  }
  const report = buildWeightedBouncePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
