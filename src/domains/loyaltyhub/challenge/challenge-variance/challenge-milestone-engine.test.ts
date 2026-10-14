import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeMilestoneEngine } from "./challenge-milestone-engine.js";
import { newChallengeMilestone } from "./challenge-milestone.js";

test("ChallengeMilestoneEngine keeps results within bounds", () => {
  const engine = defaultChallengeMilestoneEngine(flags.newRegistry());
  const item = newChallengeMilestone("code-39", "name-902");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
