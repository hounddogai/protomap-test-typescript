import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredLeaderboardAuditEngine } from "./tiered-leaderboard-audit-engine.js";
import { newTieredLeaderboardAudit } from "./tiered-leaderboard-audit.js";

test("TieredLeaderboardAuditEngine keeps results within bounds", () => {
  const engine = defaultTieredLeaderboardAuditEngine(flags.newRegistry());
  const item = newTieredLeaderboardAudit("code-938", "name-220");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
