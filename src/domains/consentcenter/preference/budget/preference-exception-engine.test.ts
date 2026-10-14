import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceExceptionEngine } from "./preference-exception-engine.js";
import { newPreferenceException } from "./preference-exception.js";

test("PreferenceExceptionEngine keeps results within bounds", () => {
  const engine = defaultPreferenceExceptionEngine();
  const item = newPreferenceException("code-371", "title-546");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
