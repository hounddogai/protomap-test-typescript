import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelTierEngine } from "./model-tier-engine.js";
import { newModelTier } from "./model-tier.js";

test("ModelTierEngine keeps results within bounds", () => {
  const engine = defaultModelTierEngine();
  const item = newModelTier("code-602", "name-225");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
