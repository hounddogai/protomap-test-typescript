import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPreferenceBaselineReport } from "./lenient-preference-baseline-report.js";
import { LenientPreferenceBaseline, newLenientPreferenceBaseline } from "./lenient-preference-baseline.js";

test("LenientPreferenceBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_390_669);
  const items: LenientPreferenceBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientPreferenceBaseline(`lenient-preference-baseline-${index}`, "sample"));
  }
  const report = buildLenientPreferenceBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
