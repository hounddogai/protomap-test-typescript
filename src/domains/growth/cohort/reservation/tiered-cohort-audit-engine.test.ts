import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredCohortAuditEngine } from "./tiered-cohort-audit-engine.js";
import { newTieredCohortAudit } from "./tiered-cohort-audit.js";

test("TieredCohortAuditEngine keeps results within bounds", () => {
  const engine = defaultTieredCohortAuditEngine();
  const item = newTieredCohortAudit("code-733", "label-592");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
