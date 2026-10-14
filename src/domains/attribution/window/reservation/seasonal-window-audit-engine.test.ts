import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalWindowAuditEngine } from "./seasonal-window-audit-engine.js";
import { newSeasonalWindowAudit } from "./seasonal-window-audit.js";

test("SeasonalWindowAuditEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWindowAuditEngine(flags.newRegistry());
  const item = newSeasonalWindowAudit("code-444", "name-276");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
