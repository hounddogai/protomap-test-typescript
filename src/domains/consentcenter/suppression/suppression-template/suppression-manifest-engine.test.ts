import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionManifestEngine } from "./suppression-manifest-engine.js";
import { newSuppressionManifest } from "./suppression-manifest.js";

test("SuppressionManifestEngine keeps results within bounds", () => {
  const engine = defaultSuppressionManifestEngine();
  const item = newSuppressionManifest("code-463", "title-951");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
