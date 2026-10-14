import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyMentionMilestoneEngine } from "./legacy-mention-milestone-engine.js";
import { newLegacyMentionMilestone } from "./legacy-mention-milestone.js";

test("LegacyMentionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLegacyMentionMilestoneEngine();
  const item = newLegacyMentionMilestone("code-800", "label-16");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
