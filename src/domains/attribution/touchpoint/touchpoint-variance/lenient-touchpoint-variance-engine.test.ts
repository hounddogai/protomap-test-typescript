import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientTouchpointVarianceEngine } from "./lenient-touchpoint-variance-engine.js";
import { newLenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

test("LenientTouchpointVarianceEngine keeps results within bounds", () => {
  const engine = defaultLenientTouchpointVarianceEngine(flags.newRegistry());
  const item = newLenientTouchpointVariance("code-797", "name-264");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
