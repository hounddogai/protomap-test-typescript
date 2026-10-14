import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPacingAuditEngine } from "./tiered-pacing-audit-engine.js";
import { newTieredPacingAudit } from "./tiered-pacing-audit.js";

test("TieredPacingAuditEngine keeps results within bounds", () => {
  const engine = defaultTieredPacingAuditEngine();
  const item = newTieredPacingAudit("code-339", "title-732");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
