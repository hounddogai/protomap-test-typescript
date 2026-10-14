import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyEscalationExceptionEngine } from "./legacy-escalation-exception-engine.js";
import { newLegacyEscalationException } from "./legacy-escalation-exception.js";

test("LegacyEscalationExceptionEngine keeps results within bounds", () => {
  const engine = defaultLegacyEscalationExceptionEngine(flags.newRegistry());
  const item = newLegacyEscalationException("code-597", "title-379");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
