import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalWarmupRollupReport } from "./seasonal-warmup-rollup-report.js";
import { SeasonalWarmupRollup, newSeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

test("SeasonalWarmupRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_425_702);
  const items: SeasonalWarmupRollup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalWarmupRollup(`seasonal-warmup-rollup-${index}`, "sample"));
  }
  const report = buildSeasonalWarmupRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
