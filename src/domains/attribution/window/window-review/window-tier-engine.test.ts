import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowTierEngine } from "./window-tier-engine.js";
import { newWindowTier } from "./window-tier.js";

test("WindowTierEngine keeps results within bounds", () => {
  const engine = defaultWindowTierEngine();
  const item = newWindowTier("code-875", "title-623");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
