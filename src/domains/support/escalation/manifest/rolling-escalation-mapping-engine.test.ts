import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingEscalationMappingEngine } from "./rolling-escalation-mapping-engine.js";
import { newRollingEscalationMapping } from "./rolling-escalation-mapping.js";

test("RollingEscalationMappingEngine keeps results within bounds", () => {
  const engine = defaultRollingEscalationMappingEngine(flags.newRegistry());
  const item = newRollingEscalationMapping("code-184", "label-643");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
