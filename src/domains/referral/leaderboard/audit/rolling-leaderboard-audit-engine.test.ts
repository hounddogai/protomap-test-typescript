import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingLeaderboardAuditEngine } from "./rolling-leaderboard-audit-engine.js";
import { newRollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

test("RollingLeaderboardAuditEngine keeps results within bounds", () => {
  const engine = defaultRollingLeaderboardAuditEngine();
  const item = newRollingLeaderboardAudit("code-153", "label-127");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
