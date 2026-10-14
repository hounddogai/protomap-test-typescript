import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackStepAuditEngine } from "./fallback-step-audit-engine.js";
import { newFallbackStepAudit } from "./fallback-step-audit.js";

test("FallbackStepAuditEngine keeps results within bounds", () => {
  const engine = defaultFallbackStepAuditEngine(flags.newRegistry());
  const item = newFallbackStepAudit("code-990", "title-649");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
