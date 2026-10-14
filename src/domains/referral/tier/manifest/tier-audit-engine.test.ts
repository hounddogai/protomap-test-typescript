import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierAuditEngine } from "./tier-audit-engine.js";
import { newTierAudit } from "./tier-audit.js";

test("TierAuditEngine keeps results within bounds", () => {
  const engine = defaultTierAuditEngine(flags.newRegistry());
  const item = newTierAudit("code-808", "title-135");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
