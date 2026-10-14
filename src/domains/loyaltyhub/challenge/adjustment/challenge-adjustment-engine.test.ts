import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeAdjustmentEngine } from "./challenge-adjustment-engine.js";
import { newChallengeAdjustment } from "./challenge-adjustment.js";

test("ChallengeAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultChallengeAdjustmentEngine();
  const item = newChallengeAdjustment("code-157", "name-419");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
