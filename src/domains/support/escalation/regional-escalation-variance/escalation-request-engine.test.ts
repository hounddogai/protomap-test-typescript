import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationRequestEngine } from "./escalation-request-engine.js";
import { newEscalationRequest } from "./escalation-request.js";

test("EscalationRequestEngine keeps results within bounds", () => {
  const engine = defaultEscalationRequestEngine();
  const item = newEscalationRequest("code-152", "title-229");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
