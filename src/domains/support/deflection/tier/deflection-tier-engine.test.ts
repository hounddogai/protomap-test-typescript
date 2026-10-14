import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionTierEngine } from "./deflection-tier-engine.js";
import { newDeflectionTier } from "./deflection-tier.js";

test("DeflectionTierEngine keeps results within bounds", () => {
  const engine = defaultDeflectionTierEngine();
  const item = newDeflectionTier("code-534", "title-395");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
