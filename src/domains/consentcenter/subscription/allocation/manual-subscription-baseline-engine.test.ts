import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualSubscriptionBaselineEngine } from "./manual-subscription-baseline-engine.js";
import { newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

test("ManualSubscriptionBaselineEngine keeps results within bounds", () => {
  const engine = defaultManualSubscriptionBaselineEngine(flags.newRegistry());
  const item = newManualSubscriptionBaseline("code-798", "name-699");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
