import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionPolicyEngine } from "./conversion-policy-engine.js";
import { newConversionPolicy } from "./conversion-policy.js";

test("ConversionPolicyEngine keeps results within bounds", () => {
  const engine = defaultConversionPolicyEngine(flags.newRegistry());
  const item = newConversionPolicy("code-368", "name-184");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
