import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingLeaderboardOverrideEngine } from "./pending-leaderboard-override-engine.js";
import { newPendingLeaderboardOverride } from "./pending-leaderboard-override.js";

test("PendingLeaderboardOverrideEngine keeps results within bounds", () => {
  const engine = defaultPendingLeaderboardOverrideEngine();
  const item = newPendingLeaderboardOverride("code-299", "label-918");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
