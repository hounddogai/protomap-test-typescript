import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBounceEstimateEngine } from "./bounce-estimate-engine.js";
import { newBounceEstimate } from "./bounce-estimate.js";

test("BounceEstimateEngine keeps results within bounds", () => {
  const engine = defaultBounceEstimateEngine();
  const item = newBounceEstimate("code-648", "title-878");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
