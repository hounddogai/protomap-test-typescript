import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditAuditEngine } from "./credit-audit-engine.js";
import { newCreditAudit } from "./credit-audit.js";

test("CreditAuditEngine keeps results within bounds", () => {
  const engine = defaultCreditAuditEngine(flags.newRegistry());
  const item = newCreditAudit("code-200", "label-340");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
