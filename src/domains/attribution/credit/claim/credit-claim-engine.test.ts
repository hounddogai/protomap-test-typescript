import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditClaimEngine } from "./credit-claim-engine.js";
import { newCreditClaim } from "./credit-claim.js";

test("CreditClaimEngine keeps results within bounds", () => {
  const engine = defaultCreditClaimEngine(flags.newRegistry());
  const item = newCreditClaim("code-441", "name-366");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
