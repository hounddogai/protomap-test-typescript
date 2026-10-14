import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckAuditEngine } from "./fraud-check-audit-engine.js";
import { newFraudCheckAudit } from "./fraud-check-audit.js";

test("FraudCheckAuditEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckAuditEngine(flags.newRegistry());
  const item = newFraudCheckAudit("code-679", "label-988");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
