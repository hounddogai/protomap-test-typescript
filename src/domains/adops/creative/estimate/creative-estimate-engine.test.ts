import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeEstimateEngine } from "./creative-estimate-engine.js";
import { newCreativeEstimate } from "./creative-estimate.js";

test("CreativeEstimateEngine keeps results within bounds", () => {
  const engine = defaultCreativeEstimateEngine();
  const item = newCreativeEstimate("code-912", "label-763");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
