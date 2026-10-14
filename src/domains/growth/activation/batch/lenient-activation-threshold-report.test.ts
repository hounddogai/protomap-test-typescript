import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientActivationThresholdReport } from "./lenient-activation-threshold-report.js";
import { LenientActivationThreshold, newLenientActivationThreshold } from "./lenient-activation-threshold.js";

test("LenientActivationThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_638_006);
  const items: LenientActivationThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientActivationThreshold(`lenient-activation-threshold-${index}`, "sample"));
  }
  const report = buildLenientActivationThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
