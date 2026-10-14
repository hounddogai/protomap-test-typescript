import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRequestEngine } from "./reward-request-engine.js";
import { newRewardRequest } from "./reward-request.js";

test("RewardRequestEngine keeps results within bounds", () => {
  const engine = defaultRewardRequestEngine(flags.newRegistry());
  const item = newRewardRequest("code-94", "label-253");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
