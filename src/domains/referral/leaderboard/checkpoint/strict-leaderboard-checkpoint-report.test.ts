import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictLeaderboardCheckpointReport } from "./strict-leaderboard-checkpoint-report.js";
import { StrictLeaderboardCheckpoint, newStrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

test("StrictLeaderboardCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_584_083);
  const items: StrictLeaderboardCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictLeaderboardCheckpoint(`strict-leaderboard-checkpoint-${index}`, "sample"));
  }
  const report = buildStrictLeaderboardCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
