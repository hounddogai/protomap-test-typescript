import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyLeaderboardQuotaEngine } from "./legacy-leaderboard-quota-engine.js";
import { newLegacyLeaderboardQuota } from "./legacy-leaderboard-quota.js";

test("LegacyLeaderboardQuotaEngine keeps results within bounds", () => {
  const engine = defaultLegacyLeaderboardQuotaEngine(flags.newRegistry());
  const item = newLegacyLeaderboardQuota("code-946", "name-152");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
