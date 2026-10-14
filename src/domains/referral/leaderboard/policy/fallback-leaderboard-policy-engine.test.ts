import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackLeaderboardPolicyEngine } from "./fallback-leaderboard-policy-engine.js";
import { newFallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

test("FallbackLeaderboardPolicyEngine keeps results within bounds", () => {
  const engine = defaultFallbackLeaderboardPolicyEngine();
  const item = newFallbackLeaderboardPolicy("code-33", "name-506");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
