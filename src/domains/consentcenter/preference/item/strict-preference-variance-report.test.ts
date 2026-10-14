import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPreferenceVarianceReport } from "./strict-preference-variance-report.js";
import { StrictPreferenceVariance, newStrictPreferenceVariance } from "./strict-preference-variance.js";

test("StrictPreferenceVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_570_839);
  const items: StrictPreferenceVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictPreferenceVariance(`strict-preference-variance-${index}`, "sample"));
  }
  const report = buildStrictPreferenceVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
