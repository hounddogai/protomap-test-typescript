import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientRewardAuditEngine } from "./lenient-reward-audit-engine.js";
import { newLenientRewardAudit } from "./lenient-reward-audit.js";

test("LenientRewardAuditEngine keeps results within bounds", () => {
  const engine = defaultLenientRewardAuditEngine();
  const item = newLenientRewardAudit("code-277", "name-15");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
