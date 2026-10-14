import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPreferenceThresholdReport } from "./seasonal-preference-threshold-report.js";
import { SeasonalPreferenceThreshold, newSeasonalPreferenceThreshold } from "./seasonal-preference-threshold.js";

test("SeasonalPreferenceThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_388_547);
  const items: SeasonalPreferenceThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalPreferenceThreshold(`seasonal-preference-threshold-${index}`, "sample"));
  }
  const report = buildSeasonalPreferenceThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
