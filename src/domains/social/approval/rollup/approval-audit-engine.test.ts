import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalAuditEngine } from "./approval-audit-engine.js";
import { newApprovalAudit } from "./approval-audit.js";

test("ApprovalAuditEngine keeps results within bounds", () => {
  const engine = defaultApprovalAuditEngine();
  const item = newApprovalAudit("code-94", "name-379");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
