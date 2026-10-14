import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingOverrideReport } from "./pacing-override-report.js";
import { PacingOverride, newPacingOverride } from "./pacing-override.js";

test("PacingOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_386_022);
  const items: PacingOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPacingOverride(`pacing-override-${index}`, "sample"));
  }
  const report = buildPacingOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
