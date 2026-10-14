import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalSuppressionAuditEngine } from "./global-suppression-audit-engine.js";
import { newGlobalSuppressionAudit } from "./global-suppression-audit.js";

test("GlobalSuppressionAuditEngine keeps results within bounds", () => {
  const engine = defaultGlobalSuppressionAuditEngine();
  const item = newGlobalSuppressionAudit("code-480", "title-713");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
