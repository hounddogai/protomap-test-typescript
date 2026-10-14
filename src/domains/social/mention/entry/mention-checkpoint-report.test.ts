import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionCheckpointReport } from "./mention-checkpoint-report.js";
import { MentionCheckpoint, newMentionCheckpoint } from "./mention-checkpoint.js";

test("MentionCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_485_469);
  const items: MentionCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newMentionCheckpoint(`mention-checkpoint-${index}`, "sample"));
  }
  const report = buildMentionCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
