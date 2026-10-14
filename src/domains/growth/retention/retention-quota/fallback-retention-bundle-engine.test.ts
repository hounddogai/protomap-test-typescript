import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackRetentionBundleEngine } from "./fallback-retention-bundle-engine.js";
import { newFallbackRetentionBundle } from "./fallback-retention-bundle.js";

test("FallbackRetentionBundleEngine keeps results within bounds", () => {
  const engine = defaultFallbackRetentionBundleEngine();
  const item = newFallbackRetentionBundle("code-916", "name-107");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
