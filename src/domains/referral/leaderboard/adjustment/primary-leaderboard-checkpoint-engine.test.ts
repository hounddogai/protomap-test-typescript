import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryLeaderboardCheckpointEngine } from "./primary-leaderboard-checkpoint-engine.js";
import { newPrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

test("PrimaryLeaderboardCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPrimaryLeaderboardCheckpointEngine(flags.newRegistry());
  const item = newPrimaryLeaderboardCheckpoint("code-158", "label-709");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
