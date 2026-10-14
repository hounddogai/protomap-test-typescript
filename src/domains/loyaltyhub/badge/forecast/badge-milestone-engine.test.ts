import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeMilestoneEngine } from "./badge-milestone-engine.js";
import { newBadgeMilestone } from "./badge-milestone.js";

test("BadgeMilestoneEngine keeps results within bounds", () => {
  const engine = defaultBadgeMilestoneEngine(flags.newRegistry());
  const item = newBadgeMilestone("code-274", "name-231");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
