import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingStreakAuditEngine } from "./pending-streak-audit-engine.js";
import { newPendingStreakAudit } from "./pending-streak-audit.js";

test("PendingStreakAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingStreakAuditEngine(flags.newRegistry());
  const item = newPendingStreakAudit("code-632", "title-833");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
