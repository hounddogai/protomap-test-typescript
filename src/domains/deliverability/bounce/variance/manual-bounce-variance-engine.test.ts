import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualBounceVarianceEngine } from "./manual-bounce-variance-engine.js";
import { newManualBounceVariance } from "./manual-bounce-variance.js";

test("ManualBounceVarianceEngine keeps results within bounds", () => {
  const engine = defaultManualBounceVarianceEngine();
  const item = newManualBounceVariance("code-275", "label-650");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
