import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingFrequencyTargetEngine } from "./pending-frequency-target-engine.js";
import { newPendingFrequencyTarget } from "./pending-frequency-target.js";

test("PendingFrequencyTargetEngine keeps results within bounds", () => {
  const engine = defaultPendingFrequencyTargetEngine();
  const item = newPendingFrequencyTarget("code-210", "title-50");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
