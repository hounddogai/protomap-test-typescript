import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSenderCheckpointReport } from "./scheduled-sender-checkpoint-report.js";
import { ScheduledSenderCheckpoint, newScheduledSenderCheckpoint } from "./scheduled-sender-checkpoint.js";

test("ScheduledSenderCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_946_442);
  const items: ScheduledSenderCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledSenderCheckpoint(`scheduled-sender-checkpoint-${index}`, "sample"));
  }
  const report = buildScheduledSenderCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
