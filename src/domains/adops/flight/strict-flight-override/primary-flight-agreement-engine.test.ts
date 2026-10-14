import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryFlightAgreementEngine } from "./primary-flight-agreement-engine.js";
import { newPrimaryFlightAgreement } from "./primary-flight-agreement.js";

test("PrimaryFlightAgreementEngine keeps results within bounds", () => {
  const engine = defaultPrimaryFlightAgreementEngine();
  const item = newPrimaryFlightAgreement("code-860", "name-536");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
