import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveFunnelAgreementEngine } from "./adaptive-funnel-agreement-engine.js";
import { newAdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

test("AdaptiveFunnelAgreementEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveFunnelAgreementEngine(flags.newRegistry());
  const item = newAdaptiveFunnelAgreement("code-77", "label-172");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
