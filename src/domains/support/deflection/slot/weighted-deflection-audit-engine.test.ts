import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedDeflectionAuditEngine } from "./weighted-deflection-audit-engine.js";
import { newWeightedDeflectionAudit } from "./weighted-deflection-audit.js";

test("WeightedDeflectionAuditEngine keeps results within bounds", () => {
  const engine = defaultWeightedDeflectionAuditEngine();
  const item = newWeightedDeflectionAudit("code-442", "title-868");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
