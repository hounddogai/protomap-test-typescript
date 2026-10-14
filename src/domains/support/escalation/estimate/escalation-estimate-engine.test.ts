import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationEstimateEngine } from "./escalation-estimate-engine.js";
import { newEscalationEstimate } from "./escalation-estimate.js";

test("EscalationEstimateEngine keeps results within bounds", () => {
  const engine = defaultEscalationEstimateEngine();
  const item = newEscalationEstimate("code-3", "name-540");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
