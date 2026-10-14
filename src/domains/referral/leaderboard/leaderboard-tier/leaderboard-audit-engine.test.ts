import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardAuditEngine } from "./leaderboard-audit-engine.js";
import { newLeaderboardAudit } from "./leaderboard-audit.js";

test("LeaderboardAuditEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardAuditEngine();
  const item = newLeaderboardAudit("code-470", "title-440");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
