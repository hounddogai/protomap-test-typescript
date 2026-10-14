import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLeaderboardManifestReport } from "./leaderboard-manifest-report.js";
import { LeaderboardManifest, newLeaderboardManifest } from "./leaderboard-manifest.js";

test("LeaderboardManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_812_522);
  const items: LeaderboardManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLeaderboardManifest(`leaderboard-manifest-${index}`, "sample"));
  }
  const report = buildLeaderboardManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
