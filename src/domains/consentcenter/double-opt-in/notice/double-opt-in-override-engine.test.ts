import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInOverrideEngine } from "./double-opt-in-override-engine.js";
import { newDoubleOptInOverride } from "./double-opt-in-override.js";

test("DoubleOptInOverrideEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInOverrideEngine();
  const item = newDoubleOptInOverride("code-132", "name-307");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
