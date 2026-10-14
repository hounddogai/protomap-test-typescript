import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakRollupReport } from "./streak-rollup-report.js";
import { StreakRollup, newStreakRollup } from "./streak-rollup.js";

test("StreakRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_267_803);
  const items: StreakRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStreakRollup(`streak-rollup-${index}`, "sample"));
  }
  const report = buildStreakRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
