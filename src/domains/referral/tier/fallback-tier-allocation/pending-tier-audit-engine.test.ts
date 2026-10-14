import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingTierAuditEngine } from "./pending-tier-audit-engine.js";
import { newPendingTierAudit } from "./pending-tier-audit.js";

test("PendingTierAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingTierAuditEngine();
  const item = newPendingTierAudit("code-513", "title-567");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
