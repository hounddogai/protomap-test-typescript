import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalCreditRequestEngine } from "./regional-credit-request-engine.js";
import { newRegionalCreditRequest } from "./regional-credit-request.js";

test("RegionalCreditRequestEngine keeps results within bounds", () => {
  const engine = defaultRegionalCreditRequestEngine(flags.newRegistry());
  const item = newRegionalCreditRequest("code-520", "name-937");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
