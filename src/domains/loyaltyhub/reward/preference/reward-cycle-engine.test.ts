import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardCycleEngine } from "./reward-cycle-engine.js";
import { newRewardCycle } from "./reward-cycle.js";

test("RewardCycleEngine keeps results within bounds", () => {
  const engine = defaultRewardCycleEngine(flags.newRegistry());
  const item = newRewardCycle("code-467", "title-723");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
