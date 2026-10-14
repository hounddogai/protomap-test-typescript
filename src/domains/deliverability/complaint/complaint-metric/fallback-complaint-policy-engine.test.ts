import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackComplaintPolicyEngine } from "./fallback-complaint-policy-engine.js";
import { newFallbackComplaintPolicy } from "./fallback-complaint-policy.js";

test("FallbackComplaintPolicyEngine keeps results within bounds", () => {
  const engine = defaultFallbackComplaintPolicyEngine(flags.newRegistry());
  const item = newFallbackComplaintPolicy("code-442", "name-636");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
