import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelAuditEngine } from "./model-audit-engine.js";
import { newModelAudit } from "./model-audit.js";

test("ModelAuditEngine keeps results within bounds", () => {
  const engine = defaultModelAuditEngine();
  const item = newModelAudit("code-178", "name-786");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
