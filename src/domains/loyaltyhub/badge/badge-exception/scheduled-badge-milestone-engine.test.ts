import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledBadgeMilestoneEngine } from "./scheduled-badge-milestone-engine.js";
import { newScheduledBadgeMilestone } from "./scheduled-badge-milestone.js";

test("ScheduledBadgeMilestoneEngine keeps results within bounds", () => {
  const engine = defaultScheduledBadgeMilestoneEngine(flags.newRegistry());
  const item = newScheduledBadgeMilestone("code-518", "name-267");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
