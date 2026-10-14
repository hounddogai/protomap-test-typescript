import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalDomainAuditEngine } from "./seasonal-domain-audit-engine.js";
import { newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

test("SeasonalDomainAuditEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDomainAuditEngine();
  const item = newSeasonalDomainAudit("code-258", "title-312");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
