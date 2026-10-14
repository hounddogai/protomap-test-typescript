import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleAuditEngine } from "./bid-rule-audit-engine.js";
import { newBidRuleAudit } from "./bid-rule-audit.js";

test("BidRuleAuditEngine keeps results within bounds", () => {
  const engine = defaultBidRuleAuditEngine(flags.newRegistry());
  const item = newBidRuleAudit("code-229", "title-733");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
