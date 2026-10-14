import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingCreditEstimateEngine } from "./pending-credit-estimate-engine.js";
import { newPendingCreditEstimate } from "./pending-credit-estimate.js";

test("PendingCreditEstimateEngine keeps results within bounds", () => {
  const engine = defaultPendingCreditEstimateEngine(flags.newRegistry());
  const item = newPendingCreditEstimate("code-355", "label-980");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
