import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingLeaderboardDraftEngine } from "./rolling-leaderboard-draft-engine.js";
import { newRollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

test("RollingLeaderboardDraftEngine keeps results within bounds", () => {
  const engine = defaultRollingLeaderboardDraftEngine();
  const item = newRollingLeaderboardDraft("code-684", "title-348");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
