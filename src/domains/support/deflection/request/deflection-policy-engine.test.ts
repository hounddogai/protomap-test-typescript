import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionPolicyEngine } from "./deflection-policy-engine.js";
import { newDeflectionPolicy } from "./deflection-policy.js";

test("DeflectionPolicyEngine keeps results within bounds", () => {
  const engine = defaultDeflectionPolicyEngine(flags.newRegistry());
  const item = newDeflectionPolicy("code-496", "name-352");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
