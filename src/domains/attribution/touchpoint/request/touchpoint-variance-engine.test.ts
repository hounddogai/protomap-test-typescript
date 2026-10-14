import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointVarianceEngine } from "./touchpoint-variance-engine.js";
import { newTouchpointVariance } from "./touchpoint-variance.js";

test("TouchpointVarianceEngine keeps results within bounds", () => {
  const engine = defaultTouchpointVarianceEngine();
  const item = newTouchpointVariance("code-635", "label-630");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
