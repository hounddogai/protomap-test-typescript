import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardGroupEngine } from "./leaderboard-group-engine.js";
import { newLeaderboardGroup } from "./leaderboard-group.js";

test("LeaderboardGroupEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardGroupEngine(flags.newRegistry());
  const item = newLeaderboardGroup("code-302", "label-380");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
