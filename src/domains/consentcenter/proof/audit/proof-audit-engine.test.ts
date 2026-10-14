import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofAuditEngine } from "./proof-audit-engine.js";
import { newProofAudit } from "./proof-audit.js";

test("ProofAuditEngine keeps results within bounds", () => {
  const engine = defaultProofAuditEngine();
  const item = newProofAudit("code-320", "title-239");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
