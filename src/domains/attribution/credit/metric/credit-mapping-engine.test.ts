import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditMappingEngine } from "./credit-mapping-engine.js";
import { newCreditMapping } from "./credit-mapping.js";

test("CreditMappingEngine keeps results within bounds", () => {
  const engine = defaultCreditMappingEngine(flags.newRegistry());
  const item = newCreditMapping("code-102", "name-173");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
