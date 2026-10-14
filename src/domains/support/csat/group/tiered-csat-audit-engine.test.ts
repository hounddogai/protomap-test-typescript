import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredCsatAuditEngine } from "./tiered-csat-audit-engine.js";
import { newTieredCsatAudit } from "./tiered-csat-audit.js";

test("TieredCsatAuditEngine keeps results within bounds", () => {
  const engine = defaultTieredCsatAuditEngine(flags.newRegistry());
  const item = newTieredCsatAudit("code-173", "title-134");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
