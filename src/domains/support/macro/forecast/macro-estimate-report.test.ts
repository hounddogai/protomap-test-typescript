import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroEstimateReport } from "./macro-estimate-report.js";
import { MacroEstimate, newMacroEstimate } from "./macro-estimate.js";

test("MacroEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_973_470);
  const items: MacroEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMacroEstimate(`macro-estimate-${index}`, "sample"));
  }
  const report = buildMacroEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
