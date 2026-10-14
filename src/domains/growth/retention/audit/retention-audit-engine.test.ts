import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionAuditEngine } from "./retention-audit-engine.js";
import { newRetentionAudit } from "./retention-audit.js";

test("RetentionAuditEngine keeps results within bounds", () => {
  const engine = defaultRetentionAuditEngine(flags.newRegistry());
  const item = newRetentionAudit("code-895", "title-830");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
