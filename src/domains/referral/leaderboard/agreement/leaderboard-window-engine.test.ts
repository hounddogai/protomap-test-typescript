import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardWindowEngine } from "./leaderboard-window-engine.js";
import { newLeaderboardWindow } from "./leaderboard-window.js";

test("LeaderboardWindowEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardWindowEngine();
  const item = newLeaderboardWindow("code-21", "name-608");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
