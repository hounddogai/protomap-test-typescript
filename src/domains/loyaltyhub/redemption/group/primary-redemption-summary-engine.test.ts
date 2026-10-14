import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryRedemptionSummaryEngine } from "./primary-redemption-summary-engine.js";
import { newPrimaryRedemptionSummary } from "./primary-redemption-summary.js";

test("PrimaryRedemptionSummaryEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRedemptionSummaryEngine(flags.newRegistry());
  const item = newPrimaryRedemptionSummary("code-380", "label-15");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
