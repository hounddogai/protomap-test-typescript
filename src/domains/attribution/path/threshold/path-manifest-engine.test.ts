import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPathManifestEngine } from "./path-manifest-engine.js";
import { newPathManifest } from "./path-manifest.js";

test("PathManifestEngine keeps results within bounds", () => {
  const engine = defaultPathManifestEngine();
  const item = newPathManifest("code-106", "label-542");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
