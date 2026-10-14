import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationPreferenceEngine } from "./escalation-preference-engine.js";
import { newEscalationPreference } from "./escalation-preference.js";

test("EscalationPreferenceEngine keeps results within bounds", () => {
  const engine = defaultEscalationPreferenceEngine(flags.newRegistry());
  const item = newEscalationPreference("code-150", "label-278");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
