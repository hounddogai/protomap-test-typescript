import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingSubscriptionScoreEngine } from "./rolling-subscription-score-engine.js";
import { newRollingSubscriptionScore } from "./rolling-subscription-score.js";

test("RollingSubscriptionScoreEngine keeps results within bounds", () => {
  const engine = defaultRollingSubscriptionScoreEngine(flags.newRegistry());
  const item = newRollingSubscriptionScore("code-941", "title-330");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
