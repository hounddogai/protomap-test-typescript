import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingSubscriptionSummaryEngine } from "./rolling-subscription-summary-engine.js";
import { newRollingSubscriptionSummary } from "./rolling-subscription-summary.js";

test("RollingSubscriptionSummaryEngine keeps results within bounds", () => {
  const engine = defaultRollingSubscriptionSummaryEngine(flags.newRegistry());
  const item = newRollingSubscriptionSummary("code-994", "name-393");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
