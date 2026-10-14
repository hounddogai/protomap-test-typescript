import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardBundleReport } from "./leaderboard-bundle-report.js";
import { LeaderboardBundle, newLeaderboardBundle } from "./leaderboard-bundle.js";

test("LeaderboardBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_999_241);
  const items: LeaderboardBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLeaderboardBundle(`leaderboard-bundle-${index}`, "sample"));
  }
  const report = buildLeaderboardBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
