import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyEscalationBatchEngine } from "./legacy-escalation-batch-engine.js";
import { newLegacyEscalationBatch } from "./legacy-escalation-batch.js";

test("LegacyEscalationBatchEngine keeps results within bounds", () => {
  const engine = defaultLegacyEscalationBatchEngine();
  const item = newLegacyEscalationBatch("code-628", "name-97");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
