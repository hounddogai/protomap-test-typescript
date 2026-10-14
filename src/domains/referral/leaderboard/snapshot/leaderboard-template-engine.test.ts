import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardTemplateEngine } from "./leaderboard-template-engine.js";
import { newLeaderboardTemplate } from "./leaderboard-template.js";

test("LeaderboardTemplateEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardTemplateEngine();
  const item = newLeaderboardTemplate("code-643", "name-96");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
