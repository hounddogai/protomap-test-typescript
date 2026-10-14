import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledMentionCheckpointReport } from "./scheduled-mention-checkpoint-report.js";
import { ScheduledMentionCheckpoint, newScheduledMentionCheckpoint } from "./scheduled-mention-checkpoint.js";

test("ScheduledMentionCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_104_521);
  const items: ScheduledMentionCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledMentionCheckpoint(`scheduled-mention-checkpoint-${index}`, "sample"));
  }
  const report = buildScheduledMentionCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
