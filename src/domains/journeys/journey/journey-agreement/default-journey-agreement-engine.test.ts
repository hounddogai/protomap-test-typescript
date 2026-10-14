import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultJourneyAgreementEngine } from "./default-journey-agreement-engine.js";
import { newDefaultJourneyAgreement } from "./default-journey-agreement.js";

test("DefaultJourneyAgreementEngine keeps results within bounds", () => {
  const engine = defaultDefaultJourneyAgreementEngine();
  const item = newDefaultJourneyAgreement("code-406", "name-938");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
