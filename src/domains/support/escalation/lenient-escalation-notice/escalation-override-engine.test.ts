import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationOverrideEngine } from "./escalation-override-engine.js";
import { newEscalationOverride } from "./escalation-override.js";

test("EscalationOverrideEngine keeps results within bounds", () => {
  const engine = defaultEscalationOverrideEngine(flags.newRegistry());
  const item = newEscalationOverride("code-795", "name-784");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
