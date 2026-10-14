import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPacingRollupReport } from "./strict-pacing-rollup-report.js";
import { StrictPacingRollup, newStrictPacingRollup } from "./strict-pacing-rollup.js";

test("StrictPacingRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_678_533);
  const items: StrictPacingRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictPacingRollup(`strict-pacing-rollup-${index}`, "sample"));
  }
  const report = buildStrictPacingRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
