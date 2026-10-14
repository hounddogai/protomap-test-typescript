import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBounceOverrideEngine } from "./tiered-bounce-override-engine.js";
import { newTieredBounceOverride } from "./tiered-bounce-override.js";

test("TieredBounceOverrideEngine keeps results within bounds", () => {
  const engine = defaultTieredBounceOverrideEngine();
  const item = newTieredBounceOverride("code-190", "name-383");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
