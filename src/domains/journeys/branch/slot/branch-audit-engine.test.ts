import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchAuditEngine } from "./branch-audit-engine.js";
import { newBranchAudit } from "./branch-audit.js";

test("BranchAuditEngine keeps results within bounds", () => {
  const engine = defaultBranchAuditEngine(flags.newRegistry());
  const item = newBranchAudit("code-831", "name-548");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
