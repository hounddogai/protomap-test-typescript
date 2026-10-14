import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceTargetReport } from "./preference-target-report.js";
import { PreferenceTarget, newPreferenceTarget } from "./preference-target.js";

test("PreferenceTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_927_871);
  const items: PreferenceTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPreferenceTarget(`preference-target-${index}`, "sample"));
  }
  const report = buildPreferenceTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
