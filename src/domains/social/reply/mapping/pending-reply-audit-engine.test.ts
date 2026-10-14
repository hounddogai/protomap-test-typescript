import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingReplyAuditEngine } from "./pending-reply-audit-engine.js";
import { newPendingReplyAudit } from "./pending-reply-audit.js";

test("PendingReplyAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingReplyAuditEngine(flags.newRegistry());
  const item = newPendingReplyAudit("code-78", "name-571");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
