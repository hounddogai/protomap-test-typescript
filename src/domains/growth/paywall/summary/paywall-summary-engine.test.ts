import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallSummaryEngine } from "./paywall-summary-engine.js";
import { newPaywallSummary } from "./paywall-summary.js";

test("PaywallSummaryEngine keeps results within bounds", () => {
  const engine = defaultPaywallSummaryEngine(flags.newRegistry());
  const item = newPaywallSummary("code-954", "label-748");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
