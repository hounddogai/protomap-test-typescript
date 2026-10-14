import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelCheckpointReport } from "./model-checkpoint-report.js";
import { ModelCheckpoint, newModelCheckpoint } from "./model-checkpoint.js";

test("ModelCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_222_784);
  const items: ModelCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newModelCheckpoint(`model-checkpoint-${index}`, "sample"));
  }
  const report = buildModelCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
