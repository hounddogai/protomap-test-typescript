import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackSubscriptionScoreEngine } from "./fallback-subscription-score-engine.js";
import { newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

test("FallbackSubscriptionScoreEngine keeps results within bounds", () => {
  const engine = defaultFallbackSubscriptionScoreEngine(flags.newRegistry());
  const item = newFallbackSubscriptionScore("code-301", "label-21");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
