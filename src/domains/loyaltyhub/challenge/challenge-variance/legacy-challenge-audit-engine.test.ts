import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyChallengeAuditEngine } from "./legacy-challenge-audit-engine.js";
import { newLegacyChallengeAudit } from "./legacy-challenge-audit.js";

test("LegacyChallengeAuditEngine keeps results within bounds", () => {
  const engine = defaultLegacyChallengeAuditEngine();
  const item = newLegacyChallengeAudit("code-339", "title-482");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
