import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalRetentionCheckpointReport } from "./global-retention-checkpoint-report.js";
import { GlobalRetentionCheckpoint, newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

test("GlobalRetentionCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_162_778);
  const items: GlobalRetentionCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalRetentionCheckpoint(`global-retention-checkpoint-${index}`, "sample"));
  }
  const report = buildGlobalRetentionCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
