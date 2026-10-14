import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFrequencyPolicyEngine } from "./frequency-policy-engine.js";
import { newFrequencyPolicy } from "./frequency-policy.js";

test("FrequencyPolicyEngine keeps results within bounds", () => {
  const engine = defaultFrequencyPolicyEngine(flags.newRegistry());
  const item = newFrequencyPolicy("code-261", "title-530");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
