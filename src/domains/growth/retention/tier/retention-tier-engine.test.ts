import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionTierEngine } from "./retention-tier-engine.js";
import { newRetentionTier } from "./retention-tier.js";

test("RetentionTierEngine keeps results within bounds", () => {
  const engine = defaultRetentionTierEngine();
  const item = newRetentionTier("code-423", "title-168");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
