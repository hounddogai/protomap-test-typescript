import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationTargetEngine } from "./escalation-target-engine.js";
import { newEscalationTarget } from "./escalation-target.js";

test("EscalationTargetEngine keeps results within bounds", () => {
  const engine = defaultEscalationTargetEngine();
  const item = newEscalationTarget("code-295", "label-454");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
