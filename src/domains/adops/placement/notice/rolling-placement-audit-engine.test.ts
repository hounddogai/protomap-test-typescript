import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPlacementAuditEngine } from "./rolling-placement-audit-engine.js";
import { newRollingPlacementAudit } from "./rolling-placement-audit.js";

test("RollingPlacementAuditEngine keeps results within bounds", () => {
  const engine = defaultRollingPlacementAuditEngine(flags.newRegistry());
  const item = newRollingPlacementAudit("code-145", "label-679");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
