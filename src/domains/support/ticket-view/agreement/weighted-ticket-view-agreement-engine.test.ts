import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedTicketViewAgreementEngine } from "./weighted-ticket-view-agreement-engine.js";
import { newWeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

test("WeightedTicketViewAgreementEngine keeps results within bounds", () => {
  const engine = defaultWeightedTicketViewAgreementEngine();
  const item = newWeightedTicketViewAgreement("code-237", "title-363");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
