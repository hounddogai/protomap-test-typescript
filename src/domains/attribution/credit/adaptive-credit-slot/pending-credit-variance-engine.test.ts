import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingCreditVarianceEngine } from "./pending-credit-variance-engine.js";
import { newPendingCreditVariance } from "./pending-credit-variance.js";

test("PendingCreditVarianceEngine keeps results within bounds", () => {
  const engine = defaultPendingCreditVarianceEngine(flags.newRegistry());
  const item = newPendingCreditVariance("code-649", "label-839");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
