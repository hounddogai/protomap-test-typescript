import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionAuditEngine } from "./mention-audit-engine.js";
import { newMentionAudit } from "./mention-audit.js";

test("MentionAuditEngine keeps results within bounds", () => {
  const engine = defaultMentionAuditEngine(flags.newRegistry());
  const item = newMentionAudit("code-188", "label-939");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
