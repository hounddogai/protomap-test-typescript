import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackFunnelAgreementEngine } from "./fallback-funnel-agreement-engine.js";
import { newFallbackFunnelAgreement } from "./fallback-funnel-agreement.js";

test("FallbackFunnelAgreementEngine keeps results within bounds", () => {
  const engine = defaultFallbackFunnelAgreementEngine();
  const item = newFallbackFunnelAgreement("code-631", "label-783");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
