import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictWarmupManifestEngine } from "./strict-warmup-manifest-engine.js";
import { newStrictWarmupManifest } from "./strict-warmup-manifest.js";

test("StrictWarmupManifestEngine keeps results within bounds", () => {
  const engine = defaultStrictWarmupManifestEngine();
  const item = newStrictWarmupManifest("code-986", "title-754");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
