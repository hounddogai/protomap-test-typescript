import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryConversionAuditEngine } from "./primary-conversion-audit-engine.js";
import { newPrimaryConversionAudit } from "./primary-conversion-audit.js";

test("PrimaryConversionAuditEngine keeps results within bounds", () => {
  const engine = defaultPrimaryConversionAuditEngine();
  const item = newPrimaryConversionAudit("code-319", "title-388");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
