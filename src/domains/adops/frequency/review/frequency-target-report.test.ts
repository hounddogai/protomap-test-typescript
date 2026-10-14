import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyTargetReport } from "./frequency-target-report.js";
import { FrequencyTarget, newFrequencyTarget } from "./frequency-target.js";

test("FrequencyTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_845_718);
  const items: FrequencyTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFrequencyTarget(`frequency-target-${index}`, "sample"));
  }
  const report = buildFrequencyTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
