import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualConversionTierEngine } from "./manual-conversion-tier-engine.js";
import { newManualConversionTier } from "./manual-conversion-tier.js";

test("ManualConversionTierEngine keeps results within bounds", () => {
  const engine = defaultManualConversionTierEngine();
  const item = newManualConversionTier("code-20", "name-883");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
