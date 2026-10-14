import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceAdjustmentReport } from "./preference-adjustment-report.js";
import { PreferenceAdjustment, newPreferenceAdjustment } from "./preference-adjustment.js";

test("PreferenceAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_351_770);
  const items: PreferenceAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPreferenceAdjustment(`preference-adjustment-${index}`, "sample"));
  }
  const report = buildPreferenceAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
