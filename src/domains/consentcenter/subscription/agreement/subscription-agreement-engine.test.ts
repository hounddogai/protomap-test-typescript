import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionAgreementEngine } from "./subscription-agreement-engine.js";
import { newSubscriptionAgreement } from "./subscription-agreement.js";

test("SubscriptionAgreementEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionAgreementEngine(flags.newRegistry());
  const item = newSubscriptionAgreement("code-478", "title-633");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
