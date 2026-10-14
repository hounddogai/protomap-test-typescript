import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedSlaAuditEngine } from "./capped-sla-audit-engine.js";
import { newCappedSlaAudit } from "./capped-sla-audit.js";

test("CappedSlaAuditEngine keeps results within bounds", () => {
  const engine = defaultCappedSlaAuditEngine();
  const item = newCappedSlaAudit("code-705", "label-461");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
