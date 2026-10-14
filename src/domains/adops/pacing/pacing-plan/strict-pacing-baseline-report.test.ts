import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPacingBaselineReport } from "./strict-pacing-baseline-report.js";
import { StrictPacingBaseline, newStrictPacingBaseline } from "./strict-pacing-baseline.js";

test("StrictPacingBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_082_068);
  const items: StrictPacingBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictPacingBaseline(`strict-pacing-baseline-${index}`, "sample"));
  }
  const report = buildStrictPacingBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
