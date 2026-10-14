import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelRollupReport } from "./level-rollup-report.js";
import { LevelRollup, newLevelRollup } from "./level-rollup.js";

test("LevelRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_447_735);
  const items: LevelRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLevelRollup(`level-rollup-${index}`, "sample"));
  }
  const report = buildLevelRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
