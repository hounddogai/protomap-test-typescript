import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedConversionPolicyEngine } from "./capped-conversion-policy-engine.js";
import { newCappedConversionPolicy } from "./capped-conversion-policy.js";

test("CappedConversionPolicyEngine keeps results within bounds", () => {
  const engine = defaultCappedConversionPolicyEngine();
  const item = newCappedConversionPolicy("code-707", "name-897");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
