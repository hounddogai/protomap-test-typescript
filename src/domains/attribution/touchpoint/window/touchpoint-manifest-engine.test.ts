import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointManifestEngine } from "./touchpoint-manifest-engine.js";
import { newTouchpointManifest } from "./touchpoint-manifest.js";

test("TouchpointManifestEngine keeps results within bounds", () => {
  const engine = defaultTouchpointManifestEngine();
  const item = newTouchpointManifest("code-26", "name-265");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
