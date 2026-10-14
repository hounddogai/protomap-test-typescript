import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredExitRuleDigestEngine } from "./tiered-exit-rule-digest-engine.js";
import { newTieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

test("TieredExitRuleDigestEngine keeps results within bounds", () => {
  const engine = defaultTieredExitRuleDigestEngine(flags.newRegistry());
  const item = newTieredExitRuleDigest("code-628", "name-453");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
