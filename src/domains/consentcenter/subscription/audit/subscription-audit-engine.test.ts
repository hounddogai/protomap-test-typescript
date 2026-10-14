import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionAuditEngine } from "./subscription-audit-engine.js";
import { newSubscriptionAudit } from "./subscription-audit.js";

test("SubscriptionAuditEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionAuditEngine();
  const item = newSubscriptionAudit("code-108", "label-701");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
