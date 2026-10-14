import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingEscalationExceptionEngine } from "./pending-escalation-exception-engine.js";
import { newPendingEscalationException } from "./pending-escalation-exception.js";

test("PendingEscalationExceptionEngine keeps results within bounds", () => {
  const engine = defaultPendingEscalationExceptionEngine();
  const item = newPendingEscalationException("code-248", "label-655");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
