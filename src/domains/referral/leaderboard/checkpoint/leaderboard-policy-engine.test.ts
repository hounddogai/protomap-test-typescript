import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardPolicyEngine } from "./leaderboard-policy-engine.js";
import { newLeaderboardPolicy } from "./leaderboard-policy.js";

test("LeaderboardPolicyEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardPolicyEngine();
  const item = newLeaderboardPolicy("code-665", "label-575");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
