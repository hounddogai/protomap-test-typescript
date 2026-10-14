import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveModelAuditEngine } from "./adaptive-model-audit-engine.js";
import { newAdaptiveModelAudit } from "./adaptive-model-audit.js";

test("AdaptiveModelAuditEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveModelAuditEngine(flags.newRegistry());
  const item = newAdaptiveModelAudit("code-405", "name-428");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
