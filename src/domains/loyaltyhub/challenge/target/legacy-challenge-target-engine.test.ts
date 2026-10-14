import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyChallengeTargetEngine } from "./legacy-challenge-target-engine.js";
import { newLegacyChallengeTarget } from "./legacy-challenge-target.js";

test("LegacyChallengeTargetEngine keeps results within bounds", () => {
  const engine = defaultLegacyChallengeTargetEngine();
  const item = newLegacyChallengeTarget("code-96", "title-508");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
