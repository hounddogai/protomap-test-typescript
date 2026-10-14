import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingWarmupRuleEngine } from "./pending-warmup-rule-engine.js";
import { newPendingWarmupRule } from "./pending-warmup-rule.js";

test("PendingWarmupRuleEngine keeps results within bounds", () => {
  const engine = defaultPendingWarmupRuleEngine(flags.newRegistry());
  const item = newPendingWarmupRule("code-95", "name-407");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
