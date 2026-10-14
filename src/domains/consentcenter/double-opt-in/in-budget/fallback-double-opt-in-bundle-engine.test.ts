import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackDoubleOptInBundleEngine } from "./fallback-double-opt-in-bundle-engine.js";
import { newFallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

test("FallbackDoubleOptInBundleEngine keeps results within bounds", () => {
  const engine = defaultFallbackDoubleOptInBundleEngine();
  const item = newFallbackDoubleOptInBundle("code-758", "name-29");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
