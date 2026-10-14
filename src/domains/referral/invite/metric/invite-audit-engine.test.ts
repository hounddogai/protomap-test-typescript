import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteAuditEngine } from "./invite-audit-engine.js";
import { newInviteAudit } from "./invite-audit.js";

test("InviteAuditEngine keeps results within bounds", () => {
  const engine = defaultInviteAuditEngine(flags.newRegistry());
  const item = newInviteAudit("code-731", "title-523");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
