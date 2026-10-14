import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintAuditEngine } from "./complaint-audit-engine.js";
import { newComplaintAudit } from "./complaint-audit.js";

test("ComplaintAuditEngine keeps results within bounds", () => {
  const engine = defaultComplaintAuditEngine(flags.newRegistry());
  const item = newComplaintAudit("code-247", "label-233");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
