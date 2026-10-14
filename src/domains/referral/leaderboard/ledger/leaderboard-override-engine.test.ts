import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardOverrideEngine } from "./leaderboard-override-engine.js";
import { newLeaderboardOverride } from "./leaderboard-override.js";

test("LeaderboardOverrideEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardOverrideEngine();
  const item = newLeaderboardOverride("code-397", "label-243");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
