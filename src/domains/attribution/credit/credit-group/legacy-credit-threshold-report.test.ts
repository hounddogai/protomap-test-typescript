import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyCreditThresholdReport } from "./legacy-credit-threshold-report.js";
import { LegacyCreditThreshold, newLegacyCreditThreshold } from "./legacy-credit-threshold.js";

test("LegacyCreditThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_633_098);
  const items: LegacyCreditThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyCreditThreshold(`legacy-credit-threshold-${index}`, "sample"));
  }
  const report = buildLegacyCreditThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
