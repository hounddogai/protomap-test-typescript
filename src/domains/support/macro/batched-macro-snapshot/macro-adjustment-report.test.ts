import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroAdjustmentReport } from "./macro-adjustment-report.js";
import { MacroAdjustment, newMacroAdjustment } from "./macro-adjustment.js";

test("MacroAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_712_608);
  const items: MacroAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newMacroAdjustment(`macro-adjustment-${index}`, "sample"));
  }
  const report = buildMacroAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
