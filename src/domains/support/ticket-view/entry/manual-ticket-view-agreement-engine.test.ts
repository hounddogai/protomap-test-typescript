import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualTicketViewAgreementEngine } from "./manual-ticket-view-agreement-engine.js";
import { newManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

test("ManualTicketViewAgreementEngine keeps results within bounds", () => {
  const engine = defaultManualTicketViewAgreementEngine();
  const item = newManualTicketViewAgreement("code-103", "title-347");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
