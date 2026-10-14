import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDoubleOptInAuditEngine } from "./seasonal-double-opt-in-audit-engine.js";
import { newSeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

test("SeasonalDoubleOptInAuditEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDoubleOptInAuditEngine(flags.newRegistry());
  const item = newSeasonalDoubleOptInAudit("code-522", "label-528");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
