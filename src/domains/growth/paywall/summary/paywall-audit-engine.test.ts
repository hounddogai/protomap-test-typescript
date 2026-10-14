import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallAuditEngine } from "./paywall-audit-engine.js";
import { newPaywallAudit } from "./paywall-audit.js";

test("PaywallAuditEngine keeps results within bounds", () => {
  const engine = defaultPaywallAuditEngine();
  const item = newPaywallAudit("code-320", "label-227");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
