import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingWarmupManifestEngine } from "./rolling-warmup-manifest-engine.js";
import { newRollingWarmupManifest } from "./rolling-warmup-manifest.js";

test("RollingWarmupManifestEngine keeps results within bounds", () => {
  const engine = defaultRollingWarmupManifestEngine();
  const item = newRollingWarmupManifest("code-474", "label-527");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
