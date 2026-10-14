import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupAuditEngine } from "./warmup-audit-engine.js";
import { newWarmupAudit } from "./warmup-audit.js";

test("WarmupAuditEngine keeps results within bounds", () => {
  const engine = defaultWarmupAuditEngine();
  const item = newWarmupAudit("code-951", "label-848");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
