import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackOptOutAgreementEngine } from "./fallback-opt-out-agreement-engine.js";
import { newFallbackOptOutAgreement } from "./fallback-opt-out-agreement.js";

test("FallbackOptOutAgreementEngine keeps results within bounds", () => {
  const engine = defaultFallbackOptOutAgreementEngine(flags.newRegistry());
  const item = newFallbackOptOutAgreement("code-992", "title-363");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
