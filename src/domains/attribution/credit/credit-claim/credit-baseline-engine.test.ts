import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditBaselineEngine } from "./credit-baseline-engine.js";
import { newCreditBaseline } from "./credit-baseline.js";

test("CreditBaselineEngine keeps results within bounds", () => {
  const engine = defaultCreditBaselineEngine(flags.newRegistry());
  const item = newCreditBaseline("code-205", "label-573");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
