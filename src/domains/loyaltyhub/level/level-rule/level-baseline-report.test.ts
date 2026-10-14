import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelBaselineReport } from "./level-baseline-report.js";
import { LevelBaseline, newLevelBaseline } from "./level-baseline.js";

test("LevelBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_920_125);
  const items: LevelBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLevelBaseline(`level-baseline-${index}`, "sample"));
  }
  const report = buildLevelBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
