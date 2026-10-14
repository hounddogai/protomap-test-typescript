import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBadgeAuditEngine } from "./pending-badge-audit-engine.js";
import { newPendingBadgeAudit } from "./pending-badge-audit.js";

test("PendingBadgeAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingBadgeAuditEngine(flags.newRegistry());
  const item = newPendingBadgeAudit("code-965", "title-598");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
