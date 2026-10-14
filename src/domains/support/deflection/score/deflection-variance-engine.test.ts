import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionVarianceEngine } from "./deflection-variance-engine.js";
import { newDeflectionVariance } from "./deflection-variance.js";

test("DeflectionVarianceEngine keeps results within bounds", () => {
  const engine = defaultDeflectionVarianceEngine();
  const item = newDeflectionVariance("code-194", "name-438");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
