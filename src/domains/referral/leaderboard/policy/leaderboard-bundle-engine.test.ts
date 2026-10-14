import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardBundleEngine } from "./leaderboard-bundle-engine.js";
import { newLeaderboardBundle } from "./leaderboard-bundle.js";

test("LeaderboardBundleEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardBundleEngine();
  const item = newLeaderboardBundle("code-551", "label-721");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
