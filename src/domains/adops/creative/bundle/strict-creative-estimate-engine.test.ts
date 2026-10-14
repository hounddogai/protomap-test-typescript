import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictCreativeEstimateEngine } from "./strict-creative-estimate-engine.js";
import { newStrictCreativeEstimate } from "./strict-creative-estimate.js";

test("StrictCreativeEstimateEngine keeps results within bounds", () => {
  const engine = defaultStrictCreativeEstimateEngine();
  const item = newStrictCreativeEstimate("code-497", "name-448");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
