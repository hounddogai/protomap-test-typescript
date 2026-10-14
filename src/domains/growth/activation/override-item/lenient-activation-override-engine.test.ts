import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientActivationOverrideEngine } from "./lenient-activation-override-engine.js";
import { newLenientActivationOverride } from "./lenient-activation-override.js";

test("LenientActivationOverrideEngine keeps results within bounds", () => {
  const engine = defaultLenientActivationOverrideEngine();
  const item = newLenientActivationOverride("code-389", "name-483");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
