import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryBadgeMilestoneEngine } from "./primary-badge-milestone-engine.js";
import { newPrimaryBadgeMilestone } from "./primary-badge-milestone.js";

test("PrimaryBadgeMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPrimaryBadgeMilestoneEngine(flags.newRegistry());
  const item = newPrimaryBadgeMilestone("code-733", "name-133");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
