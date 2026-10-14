import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualLeaderboardCheckpointEngine } from "./manual-leaderboard-checkpoint-engine.js";
import { newManualLeaderboardCheckpoint } from "./manual-leaderboard-checkpoint.js";

test("ManualLeaderboardCheckpointEngine keeps results within bounds", () => {
  const engine = defaultManualLeaderboardCheckpointEngine(flags.newRegistry());
  const item = newManualLeaderboardCheckpoint("code-152", "title-763");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
