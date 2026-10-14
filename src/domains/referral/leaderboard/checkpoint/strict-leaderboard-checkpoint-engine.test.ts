import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictLeaderboardCheckpointEngine } from "./strict-leaderboard-checkpoint-engine.js";
import { newStrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

test("StrictLeaderboardCheckpointEngine keeps results within bounds", () => {
  const engine = defaultStrictLeaderboardCheckpointEngine(flags.newRegistry());
  const item = newStrictLeaderboardCheckpoint("code-360", "label-616");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
