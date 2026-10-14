import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackChallengeCheckpointReport } from "./fallback-challenge-checkpoint-report.js";
import { FallbackChallengeCheckpoint, newFallbackChallengeCheckpoint } from "./fallback-challenge-checkpoint.js";

test("FallbackChallengeCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_958_818);
  const items: FallbackChallengeCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackChallengeCheckpoint(`fallback-challenge-checkpoint-${index}`, "sample"));
  }
  const report = buildFallbackChallengeCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
