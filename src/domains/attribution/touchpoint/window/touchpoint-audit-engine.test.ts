import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointAuditEngine } from "./touchpoint-audit-engine.js";
import { newTouchpointAudit } from "./touchpoint-audit.js";

test("TouchpointAuditEngine keeps results within bounds", () => {
  const engine = defaultTouchpointAuditEngine();
  const item = newTouchpointAudit("code-352", "name-561");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
