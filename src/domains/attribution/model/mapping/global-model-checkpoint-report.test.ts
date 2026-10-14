import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalModelCheckpointReport } from "./global-model-checkpoint-report.js";
import { GlobalModelCheckpoint, newGlobalModelCheckpoint } from "./global-model-checkpoint.js";

test("GlobalModelCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_150_193);
  const items: GlobalModelCheckpoint[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalModelCheckpoint(`global-model-checkpoint-${index}`, "sample"));
  }
  const report = buildGlobalModelCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
