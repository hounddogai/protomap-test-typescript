import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientChallengeCheckpointReport } from "./lenient-challenge-checkpoint-report.js";
import { LenientChallengeCheckpoint, newLenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

test("LenientChallengeCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_705_787);
  const items: LenientChallengeCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientChallengeCheckpoint(`lenient-challenge-checkpoint-${index}`, "sample"));
  }
  const report = buildLenientChallengeCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
