import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementAuditEngine } from "./placement-audit-engine.js";
import { newPlacementAudit } from "./placement-audit.js";

test("PlacementAuditEngine keeps results within bounds", () => {
  const engine = defaultPlacementAuditEngine();
  const item = newPlacementAudit("code-963", "name-826");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
