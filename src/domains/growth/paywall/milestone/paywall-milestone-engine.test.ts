import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallMilestoneEngine } from "./paywall-milestone-engine.js";
import { newPaywallMilestone } from "./paywall-milestone.js";

test("PaywallMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPaywallMilestoneEngine(flags.newRegistry());
  const item = newPaywallMilestone("code-939", "title-718");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
