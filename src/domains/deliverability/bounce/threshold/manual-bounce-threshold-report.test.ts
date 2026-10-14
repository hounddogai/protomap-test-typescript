import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBounceThresholdReport } from "./manual-bounce-threshold-report.js";
import { ManualBounceThreshold, newManualBounceThreshold } from "./manual-bounce-threshold.js";

test("ManualBounceThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_636_870);
  const items: ManualBounceThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualBounceThreshold(`manual-bounce-threshold-${index}`, "sample"));
  }
  const report = buildManualBounceThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
