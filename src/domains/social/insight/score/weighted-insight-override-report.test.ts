import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedInsightOverrideReport } from "./weighted-insight-override-report.js";
import { WeightedInsightOverride, newWeightedInsightOverride } from "./weighted-insight-override.js";

test("WeightedInsightOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_069_039);
  const items: WeightedInsightOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedInsightOverride(`weighted-insight-override-${index}`, "sample"));
  }
  const report = buildWeightedInsightOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
