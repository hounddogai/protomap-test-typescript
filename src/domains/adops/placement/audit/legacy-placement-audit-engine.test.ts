import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPlacementAuditEngine } from "./legacy-placement-audit-engine.js";
import { newLegacyPlacementAudit } from "./legacy-placement-audit.js";

test("LegacyPlacementAuditEngine keeps results within bounds", () => {
  const engine = defaultLegacyPlacementAuditEngine(flags.newRegistry());
  const item = newLegacyPlacementAudit("code-273", "label-313");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
