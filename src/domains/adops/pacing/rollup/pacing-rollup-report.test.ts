import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingRollupReport } from "./pacing-rollup-report.js";
import { PacingRollup, newPacingRollup } from "./pacing-rollup.js";

test("PacingRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_499_679);
  const items: PacingRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPacingRollup(`pacing-rollup-${index}`, "sample"));
  }
  const report = buildPacingRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
