import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedInviteTargetEngine } from "./weighted-invite-target-engine.js";
import { newWeightedInviteTarget } from "./weighted-invite-target.js";

test("WeightedInviteTargetEngine keeps results within bounds", () => {
  const engine = defaultWeightedInviteTargetEngine();
  const item = newWeightedInviteTarget("code-13", "title-734");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
