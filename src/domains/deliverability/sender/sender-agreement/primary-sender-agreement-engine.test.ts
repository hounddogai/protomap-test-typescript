import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySenderAgreementEngine } from "./primary-sender-agreement-engine.js";
import { newPrimarySenderAgreement } from "./primary-sender-agreement.js";

test("PrimarySenderAgreementEngine keeps results within bounds", () => {
  const engine = defaultPrimarySenderAgreementEngine();
  const item = newPrimarySenderAgreement("code-690", "name-189");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
