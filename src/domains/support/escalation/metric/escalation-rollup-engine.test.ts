import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationRollupEngine } from "./escalation-rollup-engine.js";
import { newEscalationRollup } from "./escalation-rollup.js";

test("EscalationRollupEngine keeps results within bounds", () => {
  const engine = defaultEscalationRollupEngine();
  const item = newEscalationRollup("code-513", "name-897");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
