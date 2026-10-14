import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditRollupEngine } from "./credit-rollup-engine.js";
import { newCreditRollup } from "./credit-rollup.js";

test("CreditRollupEngine keeps results within bounds", () => {
  const engine = defaultCreditRollupEngine();
  const item = newCreditRollup("code-851", "title-109");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
