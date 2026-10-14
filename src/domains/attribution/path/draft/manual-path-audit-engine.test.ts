import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualPathAuditEngine } from "./manual-path-audit-engine.js";
import { newManualPathAudit } from "./manual-path-audit.js";

test("ManualPathAuditEngine keeps results within bounds", () => {
  const engine = defaultManualPathAuditEngine();
  const item = newManualPathAudit("code-576", "label-774");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
