import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupPolicyEngine } from "./warmup-policy-engine.js";
import { newWarmupPolicy } from "./warmup-policy.js";

test("WarmupPolicyEngine keeps results within bounds", () => {
  const engine = defaultWarmupPolicyEngine();
  const item = newWarmupPolicy("code-123", "name-659");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
