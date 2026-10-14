import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPaywallMilestoneEngine } from "./default-paywall-milestone-engine.js";
import { newDefaultPaywallMilestone } from "./default-paywall-milestone.js";

test("DefaultPaywallMilestoneEngine keeps results within bounds", () => {
  const engine = defaultDefaultPaywallMilestoneEngine(flags.newRegistry());
  const item = newDefaultPaywallMilestone("code-634", "name-239");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
