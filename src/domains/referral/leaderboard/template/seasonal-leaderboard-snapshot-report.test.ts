import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalLeaderboardSnapshotReport } from "./seasonal-leaderboard-snapshot-report.js";
import { SeasonalLeaderboardSnapshot, newSeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

test("SeasonalLeaderboardSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_114_552);
  const items: SeasonalLeaderboardSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalLeaderboardSnapshot(`seasonal-leaderboard-snapshot-${index}`, "sample"));
  }
  const report = buildSeasonalLeaderboardSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
