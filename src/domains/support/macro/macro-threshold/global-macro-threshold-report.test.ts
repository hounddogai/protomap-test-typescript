import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalMacroThresholdReport } from "./global-macro-threshold-report.js";
import { GlobalMacroThreshold, newGlobalMacroThreshold } from "./global-macro-threshold.js";

test("GlobalMacroThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_683_352);
  const items: GlobalMacroThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalMacroThreshold(`global-macro-threshold-${index}`, "sample"));
  }
  const report = buildGlobalMacroThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
