import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyBaselineReport } from "./frequency-baseline-report.js";
import { FrequencyBaseline, newFrequencyBaseline } from "./frequency-baseline.js";

test("FrequencyBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_432_386);
  const items: FrequencyBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFrequencyBaseline(`frequency-baseline-${index}`, "sample"));
  }
  const report = buildFrequencyBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
