import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyCsatMilestoneEngine } from "./legacy-csat-milestone-engine.js";
import { newLegacyCsatMilestone } from "./legacy-csat-milestone.js";

test("LegacyCsatMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLegacyCsatMilestoneEngine(flags.newRegistry());
  const item = newLegacyCsatMilestone("code-452", "title-505");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
