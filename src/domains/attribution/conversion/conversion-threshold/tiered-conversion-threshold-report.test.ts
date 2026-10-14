import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredConversionThresholdReport } from "./tiered-conversion-threshold-report.js";
import { TieredConversionThreshold, newTieredConversionThreshold } from "./tiered-conversion-threshold.js";

test("TieredConversionThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_027_849);
  const items: TieredConversionThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredConversionThreshold(`tiered-conversion-threshold-${index}`, "sample"));
  }
  const report = buildTieredConversionThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
