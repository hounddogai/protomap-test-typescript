import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackChallengeOverrideEngine } from "./fallback-challenge-override-engine.js";
import { newFallbackChallengeOverride } from "./fallback-challenge-override.js";

test("FallbackChallengeOverrideEngine keeps results within bounds", () => {
  const engine = defaultFallbackChallengeOverrideEngine();
  const item = newFallbackChallengeOverride("code-317", "name-22");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
