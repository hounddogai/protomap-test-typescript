import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualLeaderboardQuotaEngine } from "./manual-leaderboard-quota-engine.js";
import { newManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

test("ManualLeaderboardQuotaEngine keeps results within bounds", () => {
  const engine = defaultManualLeaderboardQuotaEngine(flags.newRegistry());
  const item = newManualLeaderboardQuota("code-520", "name-368");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
