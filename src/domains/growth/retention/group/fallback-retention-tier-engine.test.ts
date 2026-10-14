import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackRetentionTierEngine } from "./fallback-retention-tier-engine.js";
import { newFallbackRetentionTier } from "./fallback-retention-tier.js";

test("FallbackRetentionTierEngine keeps results within bounds", () => {
  const engine = defaultFallbackRetentionTierEngine(flags.newRegistry());
  const item = newFallbackRetentionTier("code-261", "title-632");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
