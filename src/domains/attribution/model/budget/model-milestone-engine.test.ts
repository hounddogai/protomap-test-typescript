import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelMilestoneEngine } from "./model-milestone-engine.js";
import { newModelMilestone } from "./model-milestone.js";

test("ModelMilestoneEngine keeps results within bounds", () => {
  const engine = defaultModelMilestoneEngine(flags.newRegistry());
  const item = newModelMilestone("code-821", "name-625");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
