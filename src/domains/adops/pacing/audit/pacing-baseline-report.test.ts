import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingBaselineReport } from "./pacing-baseline-report.js";
import { PacingBaseline, newPacingBaseline } from "./pacing-baseline.js";

test("PacingBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_676_007);
  const items: PacingBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPacingBaseline(`pacing-baseline-${index}`, "sample"));
  }
  const report = buildPacingBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
