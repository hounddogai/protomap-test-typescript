import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredMacroAgreementEngine } from "./tiered-macro-agreement-engine.js";
import { newTieredMacroAgreement } from "./tiered-macro-agreement.js";

test("TieredMacroAgreementEngine keeps results within bounds", () => {
  const engine = defaultTieredMacroAgreementEngine();
  const item = newTieredMacroAgreement("code-614", "title-344");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
