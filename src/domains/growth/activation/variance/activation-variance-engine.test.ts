import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationVarianceEngine } from "./activation-variance-engine.js";
import { newActivationVariance } from "./activation-variance.js";

test("ActivationVarianceEngine keeps results within bounds", () => {
  const engine = defaultActivationVarianceEngine();
  const item = newActivationVariance("code-834", "name-355");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
