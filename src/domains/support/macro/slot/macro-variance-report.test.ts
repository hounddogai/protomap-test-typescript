import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroVarianceReport } from "./macro-variance-report.js";
import { MacroVariance, newMacroVariance } from "./macro-variance.js";

test("MacroVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_423_302);
  const items: MacroVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newMacroVariance(`macro-variance-${index}`, "sample"));
  }
  const report = buildMacroVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
