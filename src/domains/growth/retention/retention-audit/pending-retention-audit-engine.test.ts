import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingRetentionAuditEngine } from "./pending-retention-audit-engine.js";
import { newPendingRetentionAudit } from "./pending-retention-audit.js";

test("PendingRetentionAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingRetentionAuditEngine(flags.newRegistry());
  const item = newPendingRetentionAudit("code-565", "title-312");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
