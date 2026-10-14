import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveActivationOverrideEngine } from "./adaptive-activation-override-engine.js";
import { newAdaptiveActivationOverride } from "./adaptive-activation-override.js";

test("AdaptiveActivationOverrideEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveActivationOverrideEngine();
  const item = newAdaptiveActivationOverride("code-248", "name-558");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
