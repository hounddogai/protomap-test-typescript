import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightAuditEngine } from "./insight-audit-engine.js";
import { newInsightAudit } from "./insight-audit.js";

test("InsightAuditEngine keeps results within bounds", () => {
  const engine = defaultInsightAuditEngine();
  const item = newInsightAudit("code-823", "name-873");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
