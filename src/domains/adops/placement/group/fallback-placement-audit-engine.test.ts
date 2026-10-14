import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPlacementAuditEngine } from "./fallback-placement-audit-engine.js";
import { newFallbackPlacementAudit } from "./fallback-placement-audit.js";

test("FallbackPlacementAuditEngine keeps results within bounds", () => {
  const engine = defaultFallbackPlacementAuditEngine();
  const item = newFallbackPlacementAudit("code-410", "label-283");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
