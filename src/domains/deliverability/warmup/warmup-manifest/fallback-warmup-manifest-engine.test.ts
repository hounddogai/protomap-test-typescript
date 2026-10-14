import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackWarmupManifestEngine } from "./fallback-warmup-manifest-engine.js";
import { newFallbackWarmupManifest } from "./fallback-warmup-manifest.js";

test("FallbackWarmupManifestEngine keeps results within bounds", () => {
  const engine = defaultFallbackWarmupManifestEngine();
  const item = newFallbackWarmupManifest("code-806", "title-261");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
