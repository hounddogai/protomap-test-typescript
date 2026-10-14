import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacySubscriptionMilestoneEngine } from "./legacy-subscription-milestone-engine.js";
import { newLegacySubscriptionMilestone } from "./legacy-subscription-milestone.js";

test("LegacySubscriptionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLegacySubscriptionMilestoneEngine(flags.newRegistry());
  const item = newLegacySubscriptionMilestone("code-335", "title-843");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
