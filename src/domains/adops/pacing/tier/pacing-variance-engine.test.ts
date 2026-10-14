import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPacingVarianceEngine } from "./pacing-variance-engine.js";
import { newPacingVariance } from "./pacing-variance.js";

test("PacingVarianceEngine keeps results within bounds", () => {
  const engine = defaultPacingVarianceEngine();
  const item = newPacingVariance("code-315", "name-296");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
