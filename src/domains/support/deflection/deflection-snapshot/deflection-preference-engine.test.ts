import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionPreferenceEngine } from "./deflection-preference-engine.js";
import { newDeflectionPreference } from "./deflection-preference.js";

test("DeflectionPreferenceEngine keeps results within bounds", () => {
  const engine = defaultDeflectionPreferenceEngine();
  const item = newDeflectionPreference("code-811", "name-749");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
