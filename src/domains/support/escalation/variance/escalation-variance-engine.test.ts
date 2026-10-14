import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationVarianceEngine } from "./escalation-variance-engine.js";
import { newEscalationVariance } from "./escalation-variance.js";

test("EscalationVarianceEngine keeps results within bounds", () => {
  const engine = defaultEscalationVarianceEngine();
  const item = newEscalationVariance("code-545", "title-978");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
