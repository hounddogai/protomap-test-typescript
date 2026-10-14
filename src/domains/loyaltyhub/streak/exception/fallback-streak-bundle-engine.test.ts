import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackStreakBundleEngine } from "./fallback-streak-bundle-engine.js";
import { newFallbackStreakBundle } from "./fallback-streak-bundle.js";

test("FallbackStreakBundleEngine keeps results within bounds", () => {
  const engine = defaultFallbackStreakBundleEngine();
  const item = newFallbackStreakBundle("code-306", "title-762");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
