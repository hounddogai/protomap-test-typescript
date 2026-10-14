import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostMilestoneEngine } from "./post-milestone-engine.js";
import { newPostMilestone } from "./post-milestone.js";

test("PostMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPostMilestoneEngine(flags.newRegistry());
  const item = newPostMilestone("code-150", "name-921");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
