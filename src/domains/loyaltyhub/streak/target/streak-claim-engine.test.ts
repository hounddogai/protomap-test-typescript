import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakClaimEngine } from "./streak-claim-engine.js";
import { newStreakClaim } from "./streak-claim.js";

test("StreakClaimEngine keeps results within bounds", () => {
  const engine = defaultStreakClaimEngine();
  const item = newStreakClaim("code-344", "name-981");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
