import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackSuppressionAuditEngine } from "./fallback-suppression-audit-engine.js";
import { newFallbackSuppressionAudit } from "./fallback-suppression-audit.js";

test("FallbackSuppressionAuditEngine keeps results within bounds", () => {
  const engine = defaultFallbackSuppressionAuditEngine();
  const item = newFallbackSuppressionAudit("code-416", "title-760");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
