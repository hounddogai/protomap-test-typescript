import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySuppressionTierEngine } from "./primary-suppression-tier-engine.js";
import { newPrimarySuppressionTier } from "./primary-suppression-tier.js";

test("PrimarySuppressionTierEngine keeps results within bounds", () => {
  const engine = defaultPrimarySuppressionTierEngine();
  const item = newPrimarySuppressionTier("code-791", "title-539");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
