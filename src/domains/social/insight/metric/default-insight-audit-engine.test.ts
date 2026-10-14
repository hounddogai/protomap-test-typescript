import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultInsightAuditEngine } from "./default-insight-audit-engine.js";
import { newDefaultInsightAudit } from "./default-insight-audit.js";

test("DefaultInsightAuditEngine keeps results within bounds", () => {
  const engine = defaultDefaultInsightAuditEngine(flags.newRegistry());
  const item = newDefaultInsightAudit("code-55", "title-700");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
