import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyQueueCheckpointReport } from "./legacy-queue-checkpoint-report.js";
import { LegacyQueueCheckpoint, newLegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

test("LegacyQueueCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_163_601);
  const items: LegacyQueueCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyQueueCheckpoint(`legacy-queue-checkpoint-${index}`, "sample"));
  }
  const report = buildLegacyQueueCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
