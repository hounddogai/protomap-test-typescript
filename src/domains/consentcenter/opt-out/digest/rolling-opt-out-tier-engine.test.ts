import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingOptOutTierEngine } from "./rolling-opt-out-tier-engine.js";
import { newRollingOptOutTier } from "./rolling-opt-out-tier.js";

test("RollingOptOutTierEngine keeps results within bounds", () => {
  const engine = defaultRollingOptOutTierEngine();
  const item = newRollingOptOutTier("code-183", "title-690");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
