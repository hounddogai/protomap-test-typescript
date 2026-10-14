import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationMappingEngine } from "./escalation-mapping-engine.js";
import { newEscalationMapping } from "./escalation-mapping.js";

test("EscalationMappingEngine keeps results within bounds", () => {
  const engine = defaultEscalationMappingEngine(flags.newRegistry());
  const item = newEscalationMapping("code-581", "title-143");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
