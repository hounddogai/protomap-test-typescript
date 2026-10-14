import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutAuditEngine } from "./payout-audit-engine.js";
import { newPayoutAudit } from "./payout-audit.js";

test("PayoutAuditEngine keeps results within bounds", () => {
  const engine = defaultPayoutAuditEngine();
  const item = newPayoutAudit("code-240", "name-446");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
