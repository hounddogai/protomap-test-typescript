import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedSlaAuditEngine } from "./batched-sla-audit-engine.js";
import { newBatchedSlaAudit } from "./batched-sla-audit.js";

test("BatchedSlaAuditEngine keeps results within bounds", () => {
  const engine = defaultBatchedSlaAuditEngine(flags.newRegistry());
  const item = newBatchedSlaAudit("code-519", "name-567");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
