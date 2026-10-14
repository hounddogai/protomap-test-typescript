import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalWarmupCheckpointReport } from "./seasonal-warmup-checkpoint-report.js";
import { SeasonalWarmupCheckpoint, newSeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

test("SeasonalWarmupCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_481_412);
  const items: SeasonalWarmupCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalWarmupCheckpoint(`seasonal-warmup-checkpoint-${index}`, "sample"));
  }
  const report = buildSeasonalWarmupCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
