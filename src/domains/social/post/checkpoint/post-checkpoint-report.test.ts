import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostCheckpointReport } from "./post-checkpoint-report.js";
import { PostCheckpoint, newPostCheckpoint } from "./post-checkpoint.js";

test("PostCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_371_626);
  const items: PostCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPostCheckpoint(`post-checkpoint-${index}`, "sample"));
  }
  const report = buildPostCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
