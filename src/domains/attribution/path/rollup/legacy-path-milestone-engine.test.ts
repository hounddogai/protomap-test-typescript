import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPathMilestoneEngine } from "./legacy-path-milestone-engine.js";
import { newLegacyPathMilestone } from "./legacy-path-milestone.js";

test("LegacyPathMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLegacyPathMilestoneEngine(flags.newRegistry());
  const item = newLegacyPathMilestone("code-49", "name-367");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
