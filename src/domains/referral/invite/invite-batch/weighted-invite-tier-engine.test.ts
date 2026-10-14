import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedInviteTierEngine } from "./weighted-invite-tier-engine.js";
import { newWeightedInviteTier } from "./weighted-invite-tier.js";

test("WeightedInviteTierEngine keeps results within bounds", () => {
  const engine = defaultWeightedInviteTierEngine();
  const item = newWeightedInviteTier("code-19", "name-27");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
