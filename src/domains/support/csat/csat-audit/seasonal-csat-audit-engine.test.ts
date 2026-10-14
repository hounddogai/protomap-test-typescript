import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalCsatAuditEngine } from "./seasonal-csat-audit-engine.js";
import { newSeasonalCsatAudit } from "./seasonal-csat-audit.js";

test("SeasonalCsatAuditEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCsatAuditEngine(flags.newRegistry());
  const item = newSeasonalCsatAudit("code-598", "label-894");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
