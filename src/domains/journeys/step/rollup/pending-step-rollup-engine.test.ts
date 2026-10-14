import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingStepRollupEngine } from "./pending-step-rollup-engine.js";
import { newPendingStepRollup } from "./pending-step-rollup.js";

test("PendingStepRollupEngine keeps results within bounds", () => {
  const engine = defaultPendingStepRollupEngine();
  const item = newPendingStepRollup("code-223", "label-972");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
