import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPreferenceBaselineReport } from "./manual-preference-baseline-report.js";
import { ManualPreferenceBaseline, newManualPreferenceBaseline } from "./manual-preference-baseline.js";

test("ManualPreferenceBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_426_749);
  const items: ManualPreferenceBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualPreferenceBaseline(`manual-preference-baseline-${index}`, "sample"));
  }
  const report = buildManualPreferenceBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
