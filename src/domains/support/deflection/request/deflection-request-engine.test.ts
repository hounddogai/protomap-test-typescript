import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionRequestEngine } from "./deflection-request-engine.js";
import { newDeflectionRequest } from "./deflection-request.js";

test("DeflectionRequestEngine keeps results within bounds", () => {
  const engine = defaultDeflectionRequestEngine();
  const item = newDeflectionRequest("code-636", "label-506");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
