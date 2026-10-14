import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledLeaderboardTemplateEngine } from "./scheduled-leaderboard-template-engine.js";
import { newScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

test("ScheduledLeaderboardTemplateEngine keeps results within bounds", () => {
  const engine = defaultScheduledLeaderboardTemplateEngine(flags.newRegistry());
  const item = newScheduledLeaderboardTemplate("code-348", "name-588");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
