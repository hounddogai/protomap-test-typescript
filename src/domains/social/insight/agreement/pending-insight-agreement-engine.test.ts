import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingInsightAgreementEngine } from "./pending-insight-agreement-engine.js";
import { newPendingInsightAgreement } from "./pending-insight-agreement.js";

test("PendingInsightAgreementEngine keeps results within bounds", () => {
  const engine = defaultPendingInsightAgreementEngine();
  const item = newPendingInsightAgreement("code-758", "title-150");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
