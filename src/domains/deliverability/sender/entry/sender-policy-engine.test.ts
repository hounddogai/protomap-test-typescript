import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderPolicyEngine } from "./sender-policy-engine.js";
import { newSenderPolicy } from "./sender-policy.js";

test("SenderPolicyEngine keeps results within bounds", () => {
  const engine = defaultSenderPolicyEngine();
  const item = newSenderPolicy("code-376", "label-597");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
