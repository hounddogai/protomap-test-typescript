import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultPostMilestoneEngine } from "./default-post-milestone-engine.js";
import { newDefaultPostMilestone } from "./default-post-milestone.js";

test("DefaultPostMilestoneEngine keeps results within bounds", () => {
  const engine = defaultDefaultPostMilestoneEngine();
  const item = newDefaultPostMilestone("code-600", "name-508");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
