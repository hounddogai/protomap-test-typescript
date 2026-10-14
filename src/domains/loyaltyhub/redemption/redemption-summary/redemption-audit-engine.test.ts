import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRedemptionAuditEngine } from "./redemption-audit-engine.js";
import { newRedemptionAudit } from "./redemption-audit.js";

test("RedemptionAuditEngine keeps results within bounds", () => {
  const engine = defaultRedemptionAuditEngine();
  const item = newRedemptionAudit("code-457", "name-405");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
