import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceRequestEngine } from "./preference-request-engine.js";
import { newPreferenceRequest } from "./preference-request.js";

test("PreferenceRequestEngine keeps results within bounds", () => {
  const engine = defaultPreferenceRequestEngine();
  const item = newPreferenceRequest("code-346", "name-945");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
