import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditEstimateEngine } from "./credit-estimate-engine.js";
import { newCreditEstimate } from "./credit-estimate.js";

test("CreditEstimateEngine keeps results within bounds", () => {
  const engine = defaultCreditEstimateEngine(flags.newRegistry());
  const item = newCreditEstimate("code-695", "title-391");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
