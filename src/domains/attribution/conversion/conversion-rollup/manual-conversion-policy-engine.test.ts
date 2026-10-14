import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualConversionPolicyEngine } from "./manual-conversion-policy-engine.js";
import { newManualConversionPolicy } from "./manual-conversion-policy.js";

test("ManualConversionPolicyEngine keeps results within bounds", () => {
  const engine = defaultManualConversionPolicyEngine(flags.newRegistry());
  const item = newManualConversionPolicy("code-206", "label-491");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
