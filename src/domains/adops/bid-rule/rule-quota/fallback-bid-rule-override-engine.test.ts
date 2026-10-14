import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackBidRuleOverrideEngine } from "./fallback-bid-rule-override-engine.js";
import { newFallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

test("FallbackBidRuleOverrideEngine keeps results within bounds", () => {
  const engine = defaultFallbackBidRuleOverrideEngine(flags.newRegistry());
  const item = newFallbackBidRuleOverride("code-829", "label-927");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
