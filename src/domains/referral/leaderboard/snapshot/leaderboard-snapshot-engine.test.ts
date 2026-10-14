import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardSnapshotEngine } from "./leaderboard-snapshot-engine.js";
import { newLeaderboardSnapshot } from "./leaderboard-snapshot.js";

test("LeaderboardSnapshotEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardSnapshotEngine();
  const item = newLeaderboardSnapshot("code-81", "name-660");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
