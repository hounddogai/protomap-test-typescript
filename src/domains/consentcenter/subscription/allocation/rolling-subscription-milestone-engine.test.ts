import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingSubscriptionMilestoneEngine } from "./rolling-subscription-milestone-engine.js";
import { newRollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

test("RollingSubscriptionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultRollingSubscriptionMilestoneEngine(flags.newRegistry());
  const item = newRollingSubscriptionMilestone("code-438", "title-649");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
