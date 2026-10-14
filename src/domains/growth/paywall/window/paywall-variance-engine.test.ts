import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallVarianceEngine } from "./paywall-variance-engine.js";
import { newPaywallVariance } from "./paywall-variance.js";

test("PaywallVarianceEngine keeps results within bounds", () => {
  const engine = defaultPaywallVarianceEngine(flags.newRegistry());
  const item = newPaywallVariance("code-754", "label-130");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
