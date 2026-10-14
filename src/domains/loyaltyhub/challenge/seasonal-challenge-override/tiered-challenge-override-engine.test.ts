import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredChallengeOverrideEngine } from "./tiered-challenge-override-engine.js";
import { newTieredChallengeOverride } from "./tiered-challenge-override.js";

test("TieredChallengeOverrideEngine keeps results within bounds", () => {
  const engine = defaultTieredChallengeOverrideEngine();
  const item = newTieredChallengeOverride("code-249", "title-152");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
