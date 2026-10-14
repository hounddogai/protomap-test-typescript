import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingPaywallAuditEngine } from "./pending-paywall-audit-engine.js";
import { newPendingPaywallAudit } from "./pending-paywall-audit.js";

test("PendingPaywallAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingPaywallAuditEngine(flags.newRegistry());
  const item = newPendingPaywallAudit("code-896", "label-591");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
