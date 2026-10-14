import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeAuditEngine } from "./nudge-audit-engine.js";
import { newNudgeAudit } from "./nudge-audit.js";

test("NudgeAuditEngine keeps results within bounds", () => {
  const engine = defaultNudgeAuditEngine();
  const item = newNudgeAudit("code-292", "name-203");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
