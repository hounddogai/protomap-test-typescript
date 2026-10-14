import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupCheckpointReport } from "./warmup-checkpoint-report.js";
import { WarmupCheckpoint, newWarmupCheckpoint } from "./warmup-checkpoint.js";

test("WarmupCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_161_251);
  const items: WarmupCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWarmupCheckpoint(`warmup-checkpoint-${index}`, "sample"));
  }
  const report = buildWarmupCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
