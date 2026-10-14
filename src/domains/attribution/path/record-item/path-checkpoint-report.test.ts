import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathCheckpointReport } from "./path-checkpoint-report.js";
import { PathCheckpoint, newPathCheckpoint } from "./path-checkpoint.js";

test("PathCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_742_504);
  const items: PathCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPathCheckpoint(`path-checkpoint-${index}`, "sample"));
  }
  const report = buildPathCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
