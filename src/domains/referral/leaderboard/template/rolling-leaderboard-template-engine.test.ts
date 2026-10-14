import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingLeaderboardTemplateEngine } from "./rolling-leaderboard-template-engine.js";
import { newRollingLeaderboardTemplate } from "./rolling-leaderboard-template.js";

test("RollingLeaderboardTemplateEngine keeps results within bounds", () => {
  const engine = defaultRollingLeaderboardTemplateEngine();
  const item = newRollingLeaderboardTemplate("code-447", "label-780");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
