import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedFrequencyBaselineReport } from "./capped-frequency-baseline-report.js";
import { CappedFrequencyBaseline, newCappedFrequencyBaseline } from "./capped-frequency-baseline.js";

test("CappedFrequencyBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_408_817);
  const items: CappedFrequencyBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedFrequencyBaseline(`capped-frequency-baseline-${index}`, "sample"));
  }
  const report = buildCappedFrequencyBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
