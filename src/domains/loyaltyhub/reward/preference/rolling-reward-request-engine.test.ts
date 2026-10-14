import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingRewardRequestEngine } from "./rolling-reward-request-engine.js";
import { newRollingRewardRequest } from "./rolling-reward-request.js";

test("RollingRewardRequestEngine keeps results within bounds", () => {
  const engine = defaultRollingRewardRequestEngine();
  const item = newRollingRewardRequest("code-273", "label-794");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
