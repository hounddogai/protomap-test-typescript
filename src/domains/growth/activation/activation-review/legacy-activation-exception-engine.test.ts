import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyActivationExceptionEngine } from "./legacy-activation-exception-engine.js";
import { newLegacyActivationException } from "./legacy-activation-exception.js";

test("LegacyActivationExceptionEngine keeps results within bounds", () => {
  const engine = defaultLegacyActivationExceptionEngine();
  const item = newLegacyActivationException("code-95", "name-661");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
