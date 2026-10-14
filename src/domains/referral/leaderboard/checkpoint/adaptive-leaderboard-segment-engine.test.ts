import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveLeaderboardSegmentEngine } from "./adaptive-leaderboard-segment-engine.js";
import { newAdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

test("AdaptiveLeaderboardSegmentEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveLeaderboardSegmentEngine(flags.newRegistry());
  const item = newAdaptiveLeaderboardSegment("code-464", "name-382");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
