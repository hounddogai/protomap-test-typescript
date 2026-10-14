import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackBounceProfileEngine } from "./fallback-bounce-profile-engine.js";
import { newFallbackBounceProfile } from "./fallback-bounce-profile.js";

test("FallbackBounceProfileEngine keeps results within bounds", () => {
  const engine = defaultFallbackBounceProfileEngine();
  const item = newFallbackBounceProfile("code-856", "name-225");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
