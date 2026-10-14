import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingProofAuditEngine } from "./pending-proof-audit-engine.js";
import { newPendingProofAudit } from "./pending-proof-audit.js";

test("PendingProofAuditEngine keeps results within bounds", () => {
  const engine = defaultPendingProofAuditEngine();
  const item = newPendingProofAudit("code-446", "title-162");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
