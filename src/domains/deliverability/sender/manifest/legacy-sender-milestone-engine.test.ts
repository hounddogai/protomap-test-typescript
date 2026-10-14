import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacySenderMilestoneEngine } from "./legacy-sender-milestone-engine.js";
import { newLegacySenderMilestone } from "./legacy-sender-milestone.js";

test("LegacySenderMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLegacySenderMilestoneEngine(flags.newRegistry());
  const item = newLegacySenderMilestone("code-416", "label-703");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
