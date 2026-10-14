import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSuppressionManifestEngine } from "./regional-suppression-manifest-engine.js";
import { newRegionalSuppressionManifest } from "./regional-suppression-manifest.js";

test("RegionalSuppressionManifestEngine keeps results within bounds", () => {
  const engine = defaultRegionalSuppressionManifestEngine();
  const item = newRegionalSuppressionManifest("code-166", "label-996");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
