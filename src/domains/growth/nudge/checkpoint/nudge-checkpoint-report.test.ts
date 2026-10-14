import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeCheckpointReport } from "./nudge-checkpoint-report.js";
import { NudgeCheckpoint, newNudgeCheckpoint } from "./nudge-checkpoint.js";

test("NudgeCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_089_271);
  const items: NudgeCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newNudgeCheckpoint(`nudge-checkpoint-${index}`, "sample"));
  }
  const report = buildNudgeCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
