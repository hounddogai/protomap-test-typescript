import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInThresholdReport } from "./double-opt-in-threshold-report.js";
import { DoubleOptInThreshold, newDoubleOptInThreshold } from "./double-opt-in-threshold.js";

test("DoubleOptInThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_497_918);
  const items: DoubleOptInThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDoubleOptInThreshold(`double-opt-in-threshold-${index}`, "sample"));
  }
  const report = buildDoubleOptInThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
