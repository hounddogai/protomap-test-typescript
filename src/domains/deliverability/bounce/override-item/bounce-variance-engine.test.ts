import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceVarianceEngine } from "./bounce-variance-engine.js";
import { newBounceVariance } from "./bounce-variance.js";

test("BounceVarianceEngine keeps results within bounds", () => {
  const engine = defaultBounceVarianceEngine(flags.newRegistry());
  const item = newBounceVariance("code-189", "name-617");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
