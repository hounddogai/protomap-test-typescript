import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveActivationExceptionEngine } from "./adaptive-activation-exception-engine.js";
import { newAdaptiveActivationException } from "./adaptive-activation-exception.js";

test("AdaptiveActivationExceptionEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveActivationExceptionEngine();
  const item = newAdaptiveActivationException("code-781", "label-767");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
