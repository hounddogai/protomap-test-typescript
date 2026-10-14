import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderAuditEngine } from "./sender-audit-engine.js";
import { newSenderAudit } from "./sender-audit.js";

test("SenderAuditEngine keeps results within bounds", () => {
  const engine = defaultSenderAuditEngine(flags.newRegistry());
  const item = newSenderAudit("code-473", "name-628");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
