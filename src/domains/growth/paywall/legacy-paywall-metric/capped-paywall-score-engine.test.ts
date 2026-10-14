import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedPaywallScoreEngine } from "./capped-paywall-score-engine.js";
import { newCappedPaywallScore } from "./capped-paywall-score.js";

test("CappedPaywallScoreEngine keeps results within bounds", () => {
  const engine = defaultCappedPaywallScoreEngine(flags.newRegistry());
  const item = newCappedPaywallScore("code-183", "label-400");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
