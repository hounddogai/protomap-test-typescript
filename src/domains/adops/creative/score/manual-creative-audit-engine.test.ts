import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualCreativeAuditEngine } from "./manual-creative-audit-engine.js";
import { newManualCreativeAudit } from "./manual-creative-audit.js";

test("ManualCreativeAuditEngine keeps results within bounds", () => {
  const engine = defaultManualCreativeAuditEngine();
  const item = newManualCreativeAudit("code-926", "title-754");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
